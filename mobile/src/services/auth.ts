// Auth service interface and implementations

export interface AuthProvider {
  signInWithEmail(email: string, password: string): Promise<{ uid: string; token: string }>;
  signUpWithEmail(email: string, password: string): Promise<{ uid: string; token: string }>;
  signInWithSocial(provider: 'google' | 'kakao'): Promise<{ uid: string; token: string }>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
}

// Dummy implementation for development - simulates Firebase
export class DummyAuthProvider implements AuthProvider {
  async signInWithEmail(email: string, _password: string) {
    await new Promise((r) => setTimeout(r, 500));
    const uid = `dev-${email.replace(/[^a-z0-9]/gi, '')}`;
    const token = `dev_${email}`;
    return { uid, token };
  }

  async signUpWithEmail(email: string, _password: string) {
    await new Promise((r) => setTimeout(r, 500));
    const uid = `dev-${email.replace(/[^a-z0-9]/gi, '')}`;
    const token = `dev_${email}`;
    return { uid, token };
  }

  async signInWithSocial(provider: 'google' | 'kakao') {
    await new Promise((r) => setTimeout(r, 800));
    const email = `${provider}user@farmdirect.kr`;
    return { uid: `dev-${provider}-user`, token: `dev_${email}` };
  }

  async signOut() {
    // No-op for dummy
  }

  async resetPassword(_email: string) {
    await new Promise((r) => setTimeout(r, 300));
    // No-op, just simulate success
  }
}

// Real Firebase implementation (to be used in production)
export class FirebaseAuthProvider implements AuthProvider {
  async signInWithEmail(_email: string, _password: string): Promise<{ uid: string; token: string }> {
    // const auth = getAuth();
    // const credential = await signInWithEmailAndPassword(auth, email, password);
    // const token = await credential.user.getIdToken();
    // return { uid: credential.user.uid, token };
    throw new Error('Firebase not configured. Set USE_REAL_AUTH=true and install @react-native-firebase/auth');
  }

  async signUpWithEmail(_email: string, _password: string): Promise<{ uid: string; token: string }> {
    throw new Error('Firebase not configured');
  }

  async signInWithSocial(_provider: 'google' | 'kakao'): Promise<{ uid: string; token: string }> {
    throw new Error('Firebase not configured');
  }

  async signOut(): Promise<void> {
    throw new Error('Firebase not configured');
  }

  async resetPassword(_email: string): Promise<void> {
    throw new Error('Firebase not configured');
  }
}

// Factory - change to true when Firebase is configured
const USE_REAL_AUTH = false;

export const authProvider: AuthProvider = USE_REAL_AUTH
  ? new FirebaseAuthProvider()
  : new DummyAuthProvider();
