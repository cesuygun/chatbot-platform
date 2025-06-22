import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bot, Zap, BrainCircuit, BarChart, Settings, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: BrainCircuit,
    title: 'Train on Your Data',
    description:
      'Upload documents, add website links, or connect your knowledge base to create a chatbot with expert knowledge.',
  },
  {
    icon: Zap,
    title: 'Deploy in Seconds',
    description:
      'Embed a beautiful chat widget on your website with a simple copy-paste, or integrate with our API.',
  },
  {
    icon: Bot,
    title: 'Automate & Engage',
    description:
      'Provide instant answers to customer questions, capture leads, and improve user engagement automatically.',
  },
  {
    icon: BarChart,
    title: 'Analytics & Insights',
    description:
      'Track conversation metrics, understand user queries, and get insights to improve your chatbot’s performance.',
  },
  {
    icon: Settings,
    title: 'Highly Customizable',
    description:
      'Customize the look and feel of your chat widget, and tailor the AI’s personality to match your brand.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Reliable',
    description:
      'Enterprise-grade security to ensure your data is safe. Our platform is reliable and built to scale with your needs.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <nav className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-800">ChatBot Platform</span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/features">
              <Button variant="ghost">Features</Button>
            </Link>
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
        <section className="bg-gray-50 py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-extrabold">Powerful Features to Build Smart Chatbots</h1>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                Everything you need to build, train, and deploy powerful AI chatbots for your
                business.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
              {features.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                    <feature.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              ))}
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
