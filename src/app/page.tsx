import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Placeholder components for sections
const HeroSection = () => (
  <section className="text-center py-20 bg-gray-50">
    <h1 className="text-5xl font-extrabold mb-4">Build AI Chatbots with Your Knowledge Base</h1>
    <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Train your custom AI chatbot with your documents, website, or text - no coding required.
    </p>
    <Link href="/register">
      <Button size="lg">Start for Free</Button>
    </Link>
  </section>
);

const FeatureShowcase = () => (
  <section className="py-20">
    <div className="container mx-auto text-center">
      <h2 className="text-4xl font-bold mb-12">Why ChatPro?</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="p-6">
          <h3 className="text-2xl font-semibold mb-4">Easy Knowledge Base Integration</h3>
          <p>
            Upload PDFs, scrape websites, or add custom text. Your chatbot learns your data
            instantly.
          </p>
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-semibold mb-4">Transparent & Simple Pricing</h3>
          <p>
            No hidden fees. Start for free and scale as you grow with clear, feature-rich plans.
          </p>
        </div>
        <div className="p-6">
          <h3 className="text-2xl font-semibold mb-4">Developer-Friendly</h3>
          <p>Clean APIs and embeddable widgets make it easy to integrate your chatbot anywhere.</p>
        </div>
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-20 bg-gray-50">
    <div className="container mx-auto text-center">
      <h2 className="text-4xl font-bold mb-12">Loved by Businesses Worldwide</h2>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="p-6 bg-white rounded-lg shadow">
          <p className="italic">
            "Setting up our support chatbot was incredibly fast. It's already saved us hours of
            repetitive work."
          </p>
          <p className="mt-4 font-semibold">- Alex, CEO of TechCorp</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <p className="italic">
            "The knowledge base feature is a game-changer. Our chatbot can now answer complex
            product questions accurately."
          </p>
          <p className="mt-4 font-semibold">- Sarah, Head of Support at Innovate Ltd.</p>
        </div>
      </div>
    </div>
  </section>
);

const FinalCTA = () => (
  <section className="py-24">
    <div className="container mx-auto text-center">
      <h2 className="text-3xl font-bold mb-8">Ready to transform your customer support?</h2>
      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
        Join thousands of businesses using our platform to create intelligent, knowledge-based
        chatbots.
      </p>
      <Link href="/register">
        <Button size="lg">Start Building for Free</Button>
      </Link>
    </div>
  </section>
);

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeatureShowcase />
      <Testimonials />
      <FinalCTA />
    </main>
  );
}
