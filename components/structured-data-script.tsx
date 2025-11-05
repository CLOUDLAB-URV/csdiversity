"use client"

import { useEffect } from "react"

export function StructuredDataScript() {
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin

    const webApplicationSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Conference Data Visualizer",
      "alternateName": "Academic Conference Data Visualizer",
      "description": "Visualize and analyze academic conference data from top-tier systems and networks conferences (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC). Track geographic distribution, Asian trends, diversity metrics, and Big Tech vs Academia contributions.",
      "url": baseUrl,
      "applicationCategory": "DataVisualization",
      "operatingSystem": "Web",
      "browserRequirements": "Requires JavaScript. Requires HTML5.",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD"
      },
      "creator": {
        "@type": "Organization",
        "name": "Conference Data Visualizer",
        "url": baseUrl
      },
      "featureList": [
        "Geographic distribution analysis",
        "Asian trends tracking",
        "Big Tech vs Academia comparison",
        "Committee vs Papers analysis",
        "Diversity metrics visualization",
        "Interactive filtering by conference and year",
        "Data from 2000-2024"
      ],
      "keywords": "academic conferences, systems research, networks research, data visualization, OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC",
      "inLanguage": "en-US",
      "datePublished": "2024-01-01",
      "dateModified": new Date().toISOString().split('T')[0]
    }

    const datasetSchema = {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "Academic Conference Data",
      "description": "Dataset containing academic conference papers, committee members, and geographic distribution data from systems and networks conferences. Includes approximately 9,712 accepted papers and 14,996 program committee members from OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, and other top-tier conferences.",
      "url": `${baseUrl}/about`,
      "keywords": [
        "academic conferences",
        "systems research",
        "networks research",
        "data visualization",
        "OSDI",
        "ASPLOS",
        "NSDI",
        "SIGCOMM",
        "EuroSys",
        "ATC",
        "program committee",
        "geographic distribution"
      ],
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "creator": {
        "@type": "Organization",
        "name": "Conference Data Visualizer",
        "url": baseUrl
      },
      "distribution": [
        {
          "@type": "DataDownload",
          "contentUrl": `${baseUrl}/data/unifiedPaperData.csv`,
          "encodingFormat": "CSV",
          "name": "Unified Paper Data"
        },
        {
          "@type": "DataDownload",
          "contentUrl": `${baseUrl}/data/unifiedCommitteeData.csv`,
          "encodingFormat": "CSV",
          "name": "Unified Committee Data"
        },
        {
          "@type": "DataDownload",
          "contentUrl": `${baseUrl}/data/big_companies_analysis_papers_new.csv`,
          "encodingFormat": "CSV",
          "name": "Big Tech Analysis Data"
        }
      ],
      "temporalCoverage": "2000/2024",
      "spatialCoverage": {
        "@type": "Place",
        "name": "Global"
      },
      "includedInDataCatalog": {
        "@type": "DataCatalog",
        "name": "Conference Data Visualizer Dataset"
      }
    }

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": baseUrl
        }
      ]
    }

    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Conference Data Visualizer",
      "url": baseUrl,
      "logo": `${baseUrl}/logo.png`,
      "description": "Academic conference data visualization and analysis platform",
      "sameAs": [
        "https://github.com/Marina-LA/ConferenceData"
      ]
    }

    const addScript = (id: string, schema: any) => {
      const existing = document.getElementById(id)
      if (existing) existing.remove()
      
      const script = document.createElement("script")
      script.type = "application/ld+json"
      script.text = JSON.stringify(schema)
      script.id = id
      document.head.appendChild(script)
      return script
    }

    const s1 = addScript("web-application-schema", webApplicationSchema)
    const s2 = addScript("dataset-schema", datasetSchema)
    const s3 = addScript("breadcrumb-schema", breadcrumbSchema)
    const s4 = addScript("organization-schema", organizationSchema)

    return () => {
      s1.remove()
      s2.remove()
      s3.remove()
      s4.remove()
    }
  }, [])

  return null
}

