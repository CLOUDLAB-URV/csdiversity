import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Calendar, Users, BookOpen } from "lucide-react";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about the Conference Data Visualizer project, methodology, data sources, and how we analyze academic conference data from systems and networks conferences. Discover our data collection process, continental classification methodology, diversity metrics, and Big Tech vs Academia analysis.",
  keywords: [
    "conference data methodology",
    "academic data collection",
    "research methodology",
    "data sources",
    "conference analysis methods",
    "academic research tools",
    "DBLP",
    "Semantic Scholar",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About - Conference Data Visualizer | Methodology & Data Sources",
    description: "Learn about the Conference Data Visualizer project, methodology, data sources, and how we analyze academic conference data from systems and networks conferences.",
    url: `${baseUrl}/about`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About - Conference Data Visualizer",
    description: "Learn about the Conference Data Visualizer project and methodology",
  },
};

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
              OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, and others. We track papers, committee composition, 
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
              <li>• Program Committee vs Papers geographic comparison</li>
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
              Our crawler gathers information from multiple sources: <strong>DBLP</strong> and <strong>Semantic Scholar</strong> 
              APIs provide structured metadata for papers (titles, authors, publication years, affiliations, and institutions). 
              For some conferences where API data was incomplete or unavailable, data was manually crawled from official 
              conference websites. Program committee member data were collected manually due to the heterogeneity of 
              conference websites. The dataset is publicly available at <a href="https://github.com/Marina-LA/ConferenceData" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">github.com/Marina-LA/ConferenceData</a>.
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
            <h3 className="font-semibold mb-2">Data Collection</h3>
            <p className="text-sm text-muted-foreground">
              Our dataset includes approximately 9,712 accepted papers and 14,996 non-deduplicated 
              program committee members (6,917 unique individuals) across all conferences under study. 
              Paper and author data were primarily collected automatically via our crawler using <strong>DBLP</strong> and 
              <strong> Semantic Scholar</strong> APIs. For some conferences where API data was incomplete or unavailable, 
              data was manually crawled from official conference websites. Program committee member data were manually 
              compiled due to inconsistent website structures across conferences and years. Citation data were removed 
              from the analysis after verification revealed significant inconsistencies in the API-provided data.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Continental Classification</h3>
            <p className="text-sm text-muted-foreground">
              Both papers and program committee members are mapped to continents based on author or member 
              affiliations. If most authors belong to the same continent, the paper (or member) is assigned 
              accordingly. In cases of ties, assignment is made uniformly at random. If most authors lack 
              institutional information, assignment is based on the majority continent among remaining authors. 
              If no country information is available, the entity remains unassigned. Over 90% of papers were 
              assigned unambiguously to a single continent.
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
          <div>
            <h3 className="font-semibold mb-2">Committee vs Papers Gap Analysis</h3>
            <p className="text-sm text-muted-foreground">
              We calculate the representation gap as Committee % minus Papers % for each continent. 
              A positive gap indicates committee over-representation, while a negative gap shows 
              paper over-representation from that region.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Data Quality</h3>
            <p className="text-sm text-muted-foreground">
              Missing affiliation data were retrieved manually from official conference websites when possible. 
              Approximately 5% of papers in each conference were assigned to a continent despite most authors 
              lacking affiliation data. While minor imperfections may exist, careful verification ensures they 
              do not materially affect the qualitative conclusions of the study.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

