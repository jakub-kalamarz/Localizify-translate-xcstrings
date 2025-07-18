import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { ArrowRight, Bot, FileJson, Globe, Zap, Shield, Check, Gauge } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <header className="px-10 h-20 flex items-center border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <Link href="#" className="flex items-center gap-3" prefetch={false}>
          <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/90 rounded-2xl flex items-center justify-center shadow-lg">
            <Globe className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl text-foreground">Localizify</span>
        </Link>
        <nav className="ml-auto flex items-center gap-8">
          <Link
            href="/translate"
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            prefetch={false}
          >
            Translate
          </Link>
          <ThemeToggle />
        </nav>
      </header>
      <main className="flex-1">
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden bg-gradient-to-br from-muted/50 to-background">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary))_0.08,transparent_40%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(var(--primary))_0.06,transparent_50%)]" />
          <div className="container px-10 text-center relative z-10">
            <div className="max-w-5xl mx-auto space-y-12">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-muted-foreground">AI-Powered Localization</span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-tight">
                Ship Globally,
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/90 bg-clip-text text-transparent">
                  Translate Instantly
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Transform your iOS, macOS, and visionOS apps for global markets in minutes. 
                Drag, drop, and dominate with AI-powered translations.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
                <Button 
                  asChild 
                  size="lg" 
                  className="px-6 py-3 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href="/translate" prefetch={false}>
                    Start Translating for Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg" 
                  className="px-6 py-3 text-base font-semibold rounded-2xl"
                >
                  <Link href="#features" prefetch={false}>
                    See Features
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-8 pt-12 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">No signup required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Works in your browser</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Privacy-first</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-24 md:py-32 lg:py-40 bg-background">
          <div className="container px-10">
            <div className="text-center space-y-8 mb-20">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-muted border border-border/50">
                <Zap className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-muted-foreground">Powerful Features</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Everything you need to go global
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
                From drag-and-drop simplicity to AI-powered translations, 
                we've built the complete localization toolkit for modern apps.
              </p>
            </div>
            
            <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="lg:col-span-2 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted p-10 border border-border/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <FileJson className="h-20 w-20" />
                </div>
                <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <FileJson className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Instant File Parsing</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Just drag and drop your .xcstrings file. Instantly see your keys and translations 
                  laid out in a clean, comprehensive table. No setup, no configuration—just results.
                </p>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted p-10 border border-border/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Bot className="h-20 w-20" />
                </div>
                <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Bot className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">AI-Powered</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Harness OpenAI's latest models for accurate, context-aware translations in dozens of languages.
                </p>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted p-10 border border-border/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="h-20 w-20" />
                </div>
                <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Privacy First</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Your data never leaves your browser. Everything is processed locally with your own API key.
                </p>
              </div>
              
              <div className="lg:col-span-2 group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted p-10 border border-border/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Globe className="h-20 w-20" />
                </div>
                <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Globe className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Multi-Language Workflow</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Our intuitive column view makes it easy to compare translations across languages, 
                  ensuring consistency and quality throughout your app's localization.
                </p>
              </div>
              
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted/50 to-muted p-10 border border-border/50 hover:shadow-xl transition-all duration-300">
                <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Gauge className="h-20 w-20" />
                </div>
                <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Gauge className="h-7 w-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  Translate your entire app in seconds, not hours. Get back to building great features.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="w-full py-24 md:py-32 lg:py-40 bg-muted/50">
          <div className="container px-10">
            <div className="text-center space-y-8 mb-20">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                Questions? We've got answers
              </h2>
              <p className="max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
                Everything you need to know about using Localizify for your app localization needs.
              </p>
            </div>
            <div className="mx-auto max-w-4xl">
              <Accordion type="single" collapsible className="space-y-6">
                <AccordionItem value="item-1" className="border border-border rounded-2xl px-8 py-2 bg-background shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-base text-foreground hover:text-primary">
                    Is my data secure?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Absolutely. Your .xcstrings file and API key are processed entirely in your browser. 
                    Nothing is ever stored on our servers. Your API key is stored in your browser's local 
                    storage for convenience and can be cleared at any time.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border border-border rounded-2xl px-8 py-2 bg-background shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-base text-foreground hover:text-primary">
                    Which AI model do you use?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    We support OpenAI's latest models including GPT-4o, GPT-4o Mini, GPT-4 Turbo, 
                    and GPT-3.5 Turbo. You provide your own OpenAI API key, giving you full control 
                    over model selection and usage costs.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border border-border rounded-2xl px-8 py-2 bg-background shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-base text-foreground hover:text-primary">
                    Can I use this for free?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    Yes, Localizify is completely free to use. You only pay for your OpenAI API usage, 
                    which typically costs just a few cents per translation session.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4" className="border border-border rounded-2xl px-8 py-2 bg-background shadow-sm">
                  <AccordionTrigger className="text-left font-semibold text-base text-foreground hover:text-primary">
                    What is an .xcstrings file?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-base leading-relaxed">
                    It's Apple's modern localization format introduced in Xcode 15. This JSON-based format 
                    organizes all your app's strings and translations in a single file, making localization 
                    much more manageable than the old .strings approach.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
        
        <section className="w-full py-24 md:py-32 lg:py-40 relative overflow-hidden bg-gradient-to-br from-primary to-primary/90">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]" />
          <div className="container px-10 relative z-10">
            <div className="text-center space-y-12">
              <div className="space-y-8">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-primary-foreground">
                  Ready to go global?
                </h2>
                <p className="mx-auto max-w-2xl text-lg text-primary-foreground/80 leading-relaxed">
                  Join thousands of developers who&apos;ve streamlined their localization workflow with Localizify.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button 
                  asChild 
                  size="lg" 
                  variant="secondary"
                  className="px-6 py-3 text-base font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href="/translate" prefetch={false}>
                    Start Translating for Free <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex flex-wrap justify-center items-center gap-6 text-primary-foreground/80">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">No signup required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">Works in your browser</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-6 sm:flex-row py-12 w-full shrink-0 items-center px-10 border-t border-border bg-background">
        <p className="text-sm text-muted-foreground">&copy; 2024 Localizify. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-8">
          <Link href="#features" className="text-sm text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
            Features
          </Link>
          <Link href="#faq" className="text-sm text-muted-foreground hover:text-primary transition-colors" prefetch={false}>
            FAQ
          </Link>
        </nav>
      </footer>
    </div>
  )
}
