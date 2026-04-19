export default function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
