// frontend/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Assicurati che bcryptjs sia installato: npm install bcryptjs @types/bcryptjs

// Inizializza Prisma Client una sola volta
let prisma: PrismaClient;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // @ts-ignore
  if (!global.prisma) {
    // @ts-ignore
    global.prisma = new PrismaClient();
  }
  // @ts-ignore
  prisma = global.prisma;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'mario.rossi@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          console.error('Authorize: Email e password sono obbligatori');
          throw new Error('Email e password sono obbligatori.');
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.hashedPassword) {
            console.error('Authorize: Utente non trovato o password non impostata per', credentials.email);
            throw new Error('Credenziali non valide.');
          }

          const isValidPassword = await bcrypt.compare(credentials.password, user.hashedPassword);

          if (!isValidPassword) {
            console.error('Authorize: Password non valida per', credentials.email);
            throw new Error('Credenziali non valide.');
          }
          
          console.log('Authorize: Utente autenticato con successo:', user.email);
          // Ritorna un oggetto che sarà memorizzato nel JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            // Aggiungi qui altre proprietà utente che vuoi nella sessione
          } as NextAuthUser; // Cast to NextAuthUser
        } catch (error) {
          console.error('Authorize: Errore durante l_autenticazione:', error);
          // Non rivelare dettagli specifici dell'errore al client per motivi di sicurezza
          throw new Error('Errore durante il tentativo di login. Riprova più tardi.');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // token.name = user.name; // name è già incluso di default se presente nell'oggetto user ritornato da authorize
        // token.email = user.email; // email è già incluso di default
        // token.role = user.role; // Esempio: se hai ruoli utente
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        // session.user.name = token.name as string; // Già presente
        // session.user.email = token.email as string; // Già presente
        // session.user.role = token.role as string; // Esempio
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login', // Pagina di login personalizzata
    // signOut: '/auth/logout',
    // error: '/auth/error', // Pagina di errore personalizzata per errori di autenticazione
    // verifyRequest: '/auth/verify-request', // (e.g. check your email)
    // newUser: '/auth/new-user' // New users will be directed here on first sign in (leave the property out to disable)
  },
  // È FONDAMENTALE impostare NEXTAUTH_SECRET nel file .env.local
  // Puoi generare un secret con: openssl rand -base64 32
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Abilita i log di debug in sviluppo
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };