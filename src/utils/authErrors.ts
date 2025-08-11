export type FriendlyAuthError = {
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
};

export const getFriendlyAuthError = (error: any, action: 'sign-in' | 'sign-up' = 'sign-in'): FriendlyAuthError => {
  const raw = (error?.message || error?.error_description || '').toString();
  const msg = raw.toLowerCase();

  // Common patterns
  if (msg.includes('invalid login credentials')) {
    return {
      title: action === 'sign-in' ? 'Sign in failed' : 'Authentication failed',
      description: 'Incorrect email or password. Please try again.',
      variant: 'destructive',
    };
  }

  if (msg.includes('email rate limit') || msg.includes('too many requests') || msg.includes('rate limit')) {
    return {
      title: 'Too many attempts',
      description: 'Please wait a few minutes before trying again.',
      variant: 'destructive',
    };
  }

  if (msg.includes('confirm') && msg.includes('email')) {
    return {
      title: 'Email not verified',
      description: 'Please verify your email before signing in.',
      variant: 'destructive',
    };
  }

  if ((msg.includes('breach') || msg.includes('pwned') || msg.includes('compromised')) && msg.includes('password')) {
    return {
      title: 'Weak or compromised password',
      description: 'This password has appeared in a data breach. Choose a different one.',
      variant: 'destructive',
    };
  }

  if (msg.includes('password should be at least') || msg.includes('password too short')) {
    return {
      title: 'Weak password',
      description: 'Use a stronger password with at least 8 characters.',
      variant: 'destructive',
    };
  }

  if (msg.includes('otp') && msg.includes('expired')) {
    return {
      title: 'Code expired',
      description: 'Your verification code expired. Request a new one.',
      variant: 'destructive',
    };
  }

  if (msg.includes('user already registered') || msg.includes('already a user')) {
    return {
      title: 'Account exists',
      description: 'An account with this email already exists. Try signing in instead.',
      variant: 'destructive',
    };
  }

  return {
    title: action === 'sign-up' ? 'Sign-up error' : 'Authentication error',
    description: raw || 'Something went wrong. Please try again.',
    variant: 'destructive',
  };
};
