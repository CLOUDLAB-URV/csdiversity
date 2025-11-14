"use client"

import { useEffect } from "react"

export function StructuredDataScript() {
  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin

    const webApplicationSchema = {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "CSdiversity",
      "alternateName": "CSdiversity",
      "description": "CSdiversity: Comprehensive academic conference data analysis and visualization platform. Explore geographic distribution, Asian trends, Big Tech vs Academia contributions, committee diversity, and research patterns across 13 top-tier systems and networks conferences (OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, SOCC, IEEECLOUD, CCGRID, EUROPAR, ICDCS, MIDDLEWARE, IC2E) from 2000-2024.",
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
        "name": "CSdiversity",
        "url": baseUrl
      },
      "featureList": [
        "Geographic distribution analysis of accepted papers",
        "Program committee geographic distribution",
        "Asian academic trends tracking over time",
        "Big Tech vs Academia comparison with regional breakdown",
        "Committee vs Papers representation gap analysis",
        "Diversity metrics visualization (Gini-Simpson Index)",
        "Interactive filtering by conference and year",
        "Data visualization from 2000-2024",
        "13 top-tier systems and networks conferences"
      ],
      "keywords": "academic conferences, systems research, networks research, data visualization, OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, SOCC, IEEECLOUD, CCGRID, EUROPAR, ICDCS, MIDDLEWARE, IC2E, geographic distribution, Asian trends, Big Tech research, committee diversity",
      "inLanguage": "en-US",
      "datePublished": "2024-01-01",
      "dateModified": new Date().toISOString().split('T')[0]
    }

    const datasetSchema = {
      "@context": "https://schema.org",
      "@type": "Dataset",
      "name": "Academic Conference Data",
      "description": "Dataset containing academic conference papers, committee members, and geographic distribution data from 13 systems and networks conferences. Includes approximately 9,712 accepted papers and 14,996 program committee members (6,917 unique individuals) from OSDI, ASPLOS, NSDI, SIGCOMM, EuroSys, ATC, SOCC, IEEECLOUD, CCGRID, EUROPAR, ICDCS, MIDDLEWARE, and IC2E. Data spans 2000-2024 with continental classification, Big Tech affiliation detection, and diversity metrics.",
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
        "SOCC",
        "IEEECLOUD",
        "CCGRID",
        "EUROPAR",
        "ICDCS",
        "MIDDLEWARE",
        "IC2E",
        "program committee",
        "geographic distribution",
        "Big Tech research",
        "Asian trends",
        "diversity metrics"
      ],
      "license": "https://creativecommons.org/licenses/by/4.0/",
      "creator": {
        "@type": "Organization",
        "name": "CSdiversity",
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
      ],
      "temporalCoverage": "2000/2024",
      "spatialCoverage": {
        "@type": "Place",
        "name": "Global"
      },
      "includedInDataCatalog": {
        "@type": "DataCatalog",
        "name": "CSdiversity Dataset"
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
      "name": "CSdiversity",
      "url": baseUrl,
      "logo": `${baseUrl}/logo.png`,
      "description": "Academic conference data visualization and analysis platform for systems and networks research",
      "sameAs": [
        "https://github.com/CLOUDLAB-URV/csdiversity"
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
