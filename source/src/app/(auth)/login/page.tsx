'use client'

import { signIn } from 'next-auth/react';

const SignInPage = () => {
    return (
        <div>
            <h2>Sign In</h2>
            <button onClick={() => signIn('google')}>Sign in with Google</button>
            <button onClick={() => signIn('apple')}>Sign in with Apple</button>
        </div>
    );
};

export default SignInPage;
