import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bot, Zap, BrainCircuit } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">ChatBot Platform</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Build Custom AI Chatbots in Minutes
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
            Train ChatGPT on your own data. Create an intelligent chatbot that answers questions,
            automates support, and engages with your customers 24/7.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link href="/register">
              <Button size="lg">Start Your Free Trial</Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </Link>
          </div>
        </section>

        <section id="features" className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-extrabold">Why Choose Our Platform?</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                Everything you need to build, train, and deploy powerful AI chatbots.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                  <BrainCircuit className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Train on Your Data</h3>
                <p className="mt-2 text-gray-600">
                  Upload documents, add website links, or connect your knowledge base to create a
                  chatbot with expert knowledge.
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                  <Zap className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Deploy in Seconds</h3>
                <p className="mt-2 text-gray-600">
                  Embed a beautiful chat widget on your website with a simple copy-paste, or
                  integrate with our API.
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                  <Bot className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold">Automate & Engage</h3>
                <p className="mt-2 text-gray-600">
                  Provide instant answers to customer questions, capture leads, and improve user
                  engagement automatically.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 ChatBot Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
