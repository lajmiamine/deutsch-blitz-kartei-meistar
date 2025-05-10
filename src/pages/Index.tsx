import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container py-12 max-w-4xl">
        <header className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="flex space-x-1">
              <div className="w-10 h-24 bg-german-black rounded-sm"></div>
              <div className="w-10 h-24 bg-german-red rounded-sm"></div>
              <div className="w-10 h-24 bg-german-gold rounded-sm"></div>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">GermanLearner</h1>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            An interactive platform to boost your German vocabulary skills with flashcards and PDF-based learning.
          </p>
        </header>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Interactive Flashcards</CardTitle>
              <CardDescription>Test your German vocabulary knowledge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center mb-4">
                <div className="text-center p-4 bg-white rounded-md shadow-sm border w-3/4 rotate-3">
                  <p className="font-bold text-xl mb-1">Haus</p>
                  <p className="text-sm text-muted-foreground">What's the English translation?</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                Practice with our adaptive flashcard system that learns from your performance and helps you focus on challenging words.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-german-gold text-black hover:bg-yellow-500">
                <Link to="/flashcards">Start Learning</Link>
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Vocabulary Management</CardTitle>
              <CardDescription>Build your custom vocabulary lists</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 bg-gray-100 rounded-md flex items-center justify-center mb-4">
                <div className="w-3/4 bg-white rounded-md shadow-sm border p-4 relative">
                  <div className="absolute top-2 right-2 h-12 w-12 bg-red-100 rounded-sm flex items-center justify-center">
                    <p className="text-xs font-medium">PDF</p>
                  </div>
                  <p className="text-sm mb-2">vocabulary_list.pdf</p>
                  <div className="space-y-1">
                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                    <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-2 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                Import vocabulary from PDF documents or manage your word collections in the admin panel to create personalized learning materials.
              </p>
            </CardContent>
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin">Access Admin Panel</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="bg-german-gold/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <div className="text-2xl font-bold">1</div>
              </div>
              <h3 className="font-bold mb-2">Add Vocabulary</h3>
              <p className="text-sm text-muted-foreground">
                Use our admin panel to manually add words or import them from PDF documents.
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-german-red/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <div className="text-2xl font-bold">2</div>
              </div>
              <h3 className="font-bold mb-2">Practice with Flashcards</h3>
              <p className="text-sm text-muted-foreground">
                Test your knowledge with our interactive flashcard system that adapts to your learning progress.
              </p>
            </div>
            
            <div className="text-center p-4">
              <div className="bg-german-black/20 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                <div className="text-2xl font-bold">3</div>
              </div>
              <h3 className="font-bold mb-2">Track Your Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your performance and see your vocabulary skills improve over time.
              </p>
            </div>
          </div>
        </section>
        
        <div className="bg-gradient-to-r from-german-black/10 via-german-red/10 to-german-gold/10 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to enhance your German vocabulary?</h2>
          <p className="mb-6 text-muted-foreground">
            Start learning with our interactive flashcard system today.
          </p>
          <Button asChild size="lg">
            <Link to="/flashcards">Get Started</Link>
          </Button>
        </div>
      </div>
      
      <footer className="bg-gray-100 py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} GermanLearner - An interactive German learning platform</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
