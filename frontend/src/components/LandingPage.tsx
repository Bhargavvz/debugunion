import { ArrowRight, Code, Users, Zap, TrendingUp, DollarSign, Star, CheckCircle, Github, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const features = [
    {
      icon: Code,
      title: 'Post Issues',
      description: 'Share your coding problems with detailed descriptions and get help from the community'
    },
    {
      icon: Users,
      title: 'Collaborate',
      description: 'Work together with developers worldwide to solve complex technical challenges'
    },
    {
      icon: DollarSign,
      title: 'Earn Bounties',
      description: 'Get paid for your expertise by solving issues and helping other developers'
    },
    {
      icon: TrendingUp,
      title: 'Level Up',
      description: 'Gain XP, unlock badges, and climb the leaderboard as you contribute to the community'
    }
  ];

  const testimonials = [
    {
      name: 'Alex Chen',
      role: 'Senior Developer',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'DebugUnion helped me solve a critical production issue in hours. The community is amazing!'
    },
    {
      name: 'Sarah Johnson',
      role: 'Frontend Engineer',
      avatar: 'https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'I\'ve earned over $500 helping other developers. It\'s rewarding both financially and professionally.'
    },
    {
      name: 'Mike Rodriguez',
      role: 'DevOps Engineer',
      avatar: 'https://images.pexels.com/photos/3785077/pexels-photo-3785077.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
      content: 'The quality of solutions here is outstanding. I always find expert help when I need it.'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
              <span className="text-sm font-bold">DU</span>
            </div>
            <span className="text-xl font-bold">DebugUnion</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => onNavigate('auth')}>
              Sign In
            </Button>
            <Button onClick={() => onNavigate('auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-primary/10 text-primary hover:bg-primary/20">
              🚀 Join 10,000+ developers worldwide
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Post a problem.
              <br />
              Fix together.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              The world's largest community of developers helping each other debug, learn, and build better software. 
              Get expert solutions and earn bounties for your expertise.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" onClick={() => onNavigate('auth')} className="text-lg px-8 py-6">
                Start Debugging
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Github className="mr-2 h-5 w-5" />
                View on GitHub
              </Button>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">15,420</div>
                <div className="text-muted-foreground">Issues Solved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">8,200+</div>
                <div className="text-muted-foreground">Active Developers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">$127K+</div>
                <div className="text-muted-foreground">Bounties Paid</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How DebugUnion Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A simple, powerful platform designed for developers, by developers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 border-0 bg-background/60 backdrop-blur">
                  <CardHeader>
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by Developers</h2>
            <p className="text-xl text-muted-foreground">
              See what our community members have to say
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center space-x-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to start debugging together?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are already helping each other solve complex problems 
            and earning bounties for their expertise.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => onNavigate('auth')} className="text-lg px-8 py-6">
              Join DebugUnion
              <Zap className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6">
              <MessageSquare className="mr-2 h-5 w-5" />
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">
                  <span className="text-sm font-bold">DU</span>
                </div>
                <span className="text-xl font-bold">DebugUnion</span>
              </div>
              <p className="text-muted-foreground">
                The world's largest community of developers helping each other debug and build better software.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Features</div>
                <div>Pricing</div>
                <div>API</div>
                <div>Documentation</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>Discord</div>
                <div>GitHub</div>
                <div>Twitter</div>
                <div>Blog</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>About</div>
                <div>Careers</div>
                <div>Privacy</div>
                <div>Terms</div>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            © 2024 DebugUnion. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}