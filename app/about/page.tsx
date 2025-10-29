import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Calendar, Users, BookOpen } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">About This Project</h1>
        <p className="text-muted-foreground mt-2">
          Understanding the landscape of academic conferences in systems and networks
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <CardTitle>Global Analysis</CardTitle>
            </div>
            <CardDescription>
              Comprehensive data from major systems conferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This visualization analyzes data from top-tier systems and networks conferences including 
              OSDI, SOSP, ASPLOS, NSDI, and SIGCOMM. We track papers, citations, committee composition, 
              and geographical distributions to understand trends in academic research.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Historical Data</CardTitle>
            </div>
            <CardDescription>
              Tracking changes over two decades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Our dataset covers the period from 2000 to 2024, allowing for long-term trend analysis. 
              We examine how the academic landscape has evolved, particularly the growth of contributions 
              from Asia and the increasing involvement of major technology companies.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <CardTitle>Key Metrics</CardTitle>
            </div>
            <CardDescription>
              What we measure and why it matters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Continental distribution of accepted papers</li>
              <li>• Evolution of Asian academic contributions</li>
              <li>• Big Tech vs Academia participation</li>
              <li>• Citation patterns and their geographical distribution</li>
              <li>• Diversity indices across conferences and committees</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5" />
              <CardTitle>Data Sources</CardTitle>
            </div>
            <CardDescription>
              Quality and methodology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Data is collected from publicly available conference proceedings, 
              organized into structured CSV and JSON formats. We track author affiliations, 
              institutional partnerships, and citation networks to provide comprehensive insights.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Continental Classification</h3>
            <p className="text-sm text-muted-foreground">
              Papers are classified by the continent of the institution of the first author. 
              When multiple institutions are present, we use the predominant affiliation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Big Tech vs Academia</h3>
            <p className="text-sm text-muted-foreground">
              We identify papers with authors affiliated with major technology companies 
              (Google, Microsoft, Meta, Amazon, Apple, etc.) versus purely academic institutions.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Diversity Index</h3>
            <p className="text-sm text-muted-foreground">
              The Gini-Simpson Index measures diversity from 0 (homogeneous) to 1 (highly diverse). 
              Higher values indicate more balanced distribution across categories.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


