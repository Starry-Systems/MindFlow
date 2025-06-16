import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Users, Download, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">MindFlow</h1>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Visual Mindmapping
            <span className="text-blue-600"> Made Simple</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create beautiful, interactive mindmaps collaboratively. 
            Organize your thoughts, plan projects, and visualize ideas with ease.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to visualize your ideas
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Intuitive Design</h4>
                <p className="text-gray-600">
                  Drag-and-drop interface that feels natural and responsive
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Collaboration</h4>
                <p className="text-gray-600">
                  Work together in real-time with your team members
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Download className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Export & Import</h4>
                <p className="text-gray-600">
                  Save your work in multiple formats including XML
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 text-center">
                <Zap className="h-12 w-12 text-amber-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Fast & Reliable</h4>
                <p className="text-gray-600">
                  Lightning-fast performance with auto-save functionality
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to organize your thoughts?
          </h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust MindFlow for their visual thinking needs.
          </p>
          <Button 
            size="lg"
            variant="secondary"
            onClick={() => window.location.href = '/api/login'}
            className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3"
          >
            Start Creating Now
          </Button>
        </div>
      </section>
    </div>
  );
}
