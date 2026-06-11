import express from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';
import { clerkClient } from '@clerk/express';

const router = express.Router();

router.post('/clerk', express.raw({ type: 'application/json' }), async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error('🔴 CLERK_WEBHOOK_SECRET environment variable is missing.');
    return res.status(500).json({ success: false, message: 'Webhook secret is not configured' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ success: false, message: 'Error occurred -- no svix headers' });
  }

  // Get the body
  const payload = req.body;

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload.toString(), {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('🔴 Error verifying webhook signature:', err.message);
    return res.status(400).json({ success: false, message: 'Error occurred -- signature verification failed' });
  }

  const { id: clerkId } = evt.data;
  const eventType = evt.type;

  console.log(`ℹ️ Received Clerk webhook event: ${eventType} for Clerk User ID: ${clerkId}`);

  try {
    if (eventType === 'user.created' || eventType === 'user.updated') {
      const { first_name, last_name, email_addresses, image_url, public_metadata } = evt.data;
      
      const email = email_addresses?.[0]?.email_address || '';
      const name = [first_name, last_name].filter(Boolean).join(' ') || email.split('@')[0] || 'Clerk User';
      const avatar = image_url || '';
      
      const updateData = {
        clerkId,
        name,
        email,
        avatar,
        lastLogin: new Date()
      };
      
      if (public_metadata?.role) {
        updateData.role = public_metadata.role;
      }
      
      if (public_metadata?.company) {
        updateData.company = public_metadata.company;
      }

      const user = await User.findOneAndUpdate(
        { clerkId },
        { $set: updateData },
        { upsert: true, new: true, runValidators: true }
      );
      
      console.log(`✅ User profile ${eventType === 'user.created' ? 'created' : 'updated'} in MongoDB:`, user._id);

      // Sync back Mongoose profile details to Clerk publicMetadata
      try {
        await clerkClient.users.updateUserMetadata(clerkId, {
          publicMetadata: {
            workspaceId: user.workspaceId,
            role: user.role,
            company: user.company
          }
        });
        console.log(`✅ Synced publicMetadata to Clerk for User: ${clerkId}`);
      } catch (clerkErr) {
        console.error(`⚠️ Failed to sync publicMetadata to Clerk for User ${clerkId}:`, clerkErr.message);
      }
    } 
    else if (eventType === 'user.deleted') {
      const deletedUser = await User.findOneAndDelete({ clerkId });
      if (deletedUser) {
        console.log(`✅ User profile deleted from MongoDB: ${deletedUser._id}`);
      } else {
        console.log(`ℹ️ User profile deletion skipped: no user found with clerkId ${clerkId}`);
      }
    }

    return res.status(200).json({ success: true, message: 'Webhook processed successfully' });
  } catch (dbError) {
    console.error('🔴 Database error processing Clerk webhook:', dbError.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error during DB operation' });
  }
});

export default router;
