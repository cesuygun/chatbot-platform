'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Rocket } from 'lucide-react';

const ComingSoon = () => {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle email submission logic here
    alert(`Thank you! We will notify ${email} on launch.`);
    setEmail('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="text-center space-y-6">
        <Rocket className="h-24 w-24 mx-auto text-primary" />
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter">
          Something Big is Coming
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          We are working hard to bring you a new, revolutionary experience. Stay tuned for the big
          reveal!
        </p>
      </div>

      <div className="w-full max-w-md mt-12">
        <p className="text-center text-lg mb-4">Be the first to know.</p>
        <form onSubmit={handleEmailSubmit} className="flex flex-col md:flex-row gap-4">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
          <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90">
            Notify Me
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ComingSoon;
