export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-6">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Conference Data Visualizer
        </h1>
        <nav className="ml-6 hidden md:flex items-center gap-6">
          <a
            href="/"
            className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </a>
          <a
            href="/about"
            className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground hover:text-foreground"
          >
            About
          </a>
        </nav>
      </div>
    </header>
  );
}

