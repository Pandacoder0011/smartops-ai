import jwt from 'jsonwebtoken';

const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'smartops_jwt_secret_dev_key', 
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

export default generateToken;
