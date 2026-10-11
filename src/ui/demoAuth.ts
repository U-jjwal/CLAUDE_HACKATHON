// DEMO ONLY, not secure, credentials are visible in the bundle
export const DEMO_CREDENTIALS = {
  email: 'test@gmail.com',
  password: '123',
} as const;

export interface OfficerUser {
  name: string;
  email: string;
  department: string;
  designation: string;
}

export const DEMO_USER: OfficerUser = {
  name: 'Demo Officer',
  email: 'test@gmail.com',
  department: 'Bhopal Municipal Corporation (demo)',
  designation: 'Sanitation Officer (demo)',
};
