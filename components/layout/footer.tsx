export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Conference Data Visualizer
          </p>
          <p className="text-sm text-muted-foreground">
            Data from OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC and more
          </p>
        </div>
      </div>
    </footer>
  );
}

