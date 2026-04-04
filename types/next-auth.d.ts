import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id:   string;
    role: 'CLIENT' | 'BARBER' | 'ADMIN';
  }
  interface Session {
    user: {
      id:     string;
      role:   'CLIENT' | 'BARBER' | 'ADMIN';
      name?:  string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:   string;
    role: 'CLIENT' | 'BARBER' | 'ADMIN';
  }
}