const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email and password required" }) };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    return {
      statusCode: 200,
      body: JSON.stringify({ token, user: { id: user.id, email: user.email } }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};