import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Calendar, Users, BookOpen, User, ExternalLink, Link2, FileText } from "lucide-react";
import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export const metadata: Metadata = {
  title: "About",
  description: "About CSdiversity: Learn about our academic conference data analysis project, methodology, data sources, and research approach. Discover how we collect and analyze data from 13 top-tier systems and networks conferences, our continental classification methodology, diversity metrics calculation, Big Tech vs Academia analysis, and access additional resources including Code Ocean and Data Portal.",
  keywords: [
    "conference data methodology",
    "academic data collection",
    "research methodology",
    "data sources",
    "conference analysis methods",
    "academic research tools",
    "DBLP",
    "Semantic Scholar",
    "CSdiversity methodology",
    "conference data collection",
    "research data sources",
    "academic research tools",
    "data visualization methodology",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About CSdiversity | Methodology, Data Sources & Research Approach",
    description: "Learn about the CSdiversity project, methodology, data sources, and research approach. Discover how we analyze academic conference data from 13 top-tier systems and networks conferences, including data collection, continental classification, diversity metrics, and Big Tech analysis.",
    url: `${baseUrl}/about`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About CSdiversity | Methodology & Data Sources",
    description: "Learn about the CSdiversity project, methodology, data sources, and research approach for analyzing academic conference data",
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

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <CardTitle>Authors</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This project was developed by:
          </p>
          <ul className="text-sm space-y-2 mb-4">
            <li>• Pedro Garcia Lopez</li>
            <li>• Marina López Alet</li>
            <li>• Usama Benabdelkrim Zakan</li>
            <li>• Anwitaman Datta</li>
          </ul>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Research group:
            </p>
            <div className="flex items-center gap-3 mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={`${basePath}/Logo_CloudLab.png`}
                alt="CloudLab Logo" 
                className="h-12 w-auto object-contain"
              />
              <a 
                href="https://cloudlab-urv.github.io/WebCloudlab/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>Cloud and Distributed Systems Lab (CLOUDLAB)</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Universitat Rovira i Virgili
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Related Publication</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-sm text-muted-foreground flex-1">
                <strong className="text-foreground">How international are international computing conferences? — An exploration with systems research conferences</strong>
              </span>
              <span className="text-sm text-muted-foreground italic whitespace-nowrap">
                Available soon
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Link2 className="h-5 w-5" />
            <CardTitle>Additional Resources</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Access additional resources and data:
          </p>
          <div className="space-y-3">
            <a 
              href="https://codeocean.com/capsule/9607607/tree" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>Code Ocean</span>
              <ExternalLink className="h-4 w-4" />
            </a>
            <a 
              href="https://dx.doi.org/10.21227/h36c-f287" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
            >
              <span>Data Port</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
