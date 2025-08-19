import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/60 via-amber-50/50 to-yellow-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Join PaperLM</h1>
          <p className="text-slate-600">Create your account to start analyzing documents with AI</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl border border-slate-200/50 rounded-2xl",
            },
          }}
        />
      </div>
    </div>
  );
}