import * as bcrypt from 'bcrypt';
const saltRounds = 10;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(saltRounds);
  const hash = await bcrypt.hash(password, salt);
  return hash;
}
export async function comparePassword(pass: string, password: string): Promise<boolean> {
  return await bcrypt.compare(pass, password);
}
