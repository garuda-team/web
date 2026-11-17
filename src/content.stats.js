/*
  Lazy data for the stats page: loaded with import() only when the page opens.
  English base here; es/ca overrides live in content.stats.es.js / content.stats.ca.js and are merged by index like content.js.
*/
import { LANG } from "./lib/lang.js";
import { merge } from "./content.js";

/*
  stats: monk parakeet data for the Stats page (source: claude_tareas/cotorra-argentina-barcelona-cataluna.md).
  Shape (identical in content.es.js / content.ca.js; lists must keep the same length):
    stats.title, lede, updated   texts
    stats.blocks[9]  { id, title, intro, kpis, tables, series, callouts, glossary, sourceGroups }
      kpis[]          { id, label, value, context }  KPI cards; value is a display string
      tables[]        { id, title, intro, cols[], rows[][], notes[], sources[] }  cells are display strings
                      (figures use the number format of each language); sources = ids of sourceGroups
      series[]        { id, title, unit, x, sources[], points[] }  real numbers (null = no data), for charts:
                      unit: individuals | index | percent | percentPerYear | count | MEUR | EUR; x: "year" | "label"
                      bcnPopulationSeries points: { year, value, low, high, type, projection }
                      new optional fields: group (translated label; series of one block sharing a group are comparable -> selector),
                      points with value/low/high (ranges: value null), bound ("min" = "more than value"), origin (nat|inv|fer)
                      series.note (optional): short text shown under the chart (e.g. mean ± interval)
                      table = accessible equivalent of the series; notes/callouts carry the warnings of the source .md
                      bcnPopulationSeries has no 2025 point on purpose: the .md asks not to cite the 11,000 projection
      callouts[]      { kind: "warning" | "info", title, text }
      glossary[]      { term, text }  (block "howToRead"; term may be "")
      sourceGroups[]  { id, title, items[] { title, url|null, detail, also[] { title, url } } }
  Block ids: summary, population, species, crops, health, spending, other, howToRead, sources.
*/
export const statsEn = {
 "title": "Monk parakeet in Barcelona and Catalonia",
 "lede": "In Barcelona the monk parakeet went from 1,441 individuals in 2001 to 6,444 in 2022, while the city's native birds fell by 35 % since 2005. There is measured damage to crops and detected pathogens, but no administration publishes how much is spent on the species.",
 "updated": "Data compiled from studies and public sources up to November 2026 for the Garuda project. The sources for each table are at the end of the document.",
 "blocks": [
  {
   "id": "summary",
   "title": "Summary",
   "intro": "",
   "kpis": [
    {
     "id": "pop2022",
     "label": "Monk parakeets in the city of Barcelona (2022 census)",
     "value": "6,444",
     "context": "4.5× compared with 2001"
    },
    {
     "id": "growthBcn",
     "label": "Annual growth in Barcelona, 2001–2022",
     "value": "+7.4 %",
     "context": "Doubles every 9.7 years"
    },
    {
     "id": "trendCat",
     "label": "Trend in Catalonia (SOCC, spring, since 2002)",
     "value": "+5.2 % per year",
     "context": "Last 10 years: +6.2 %"
    },
    {
     "id": "nativeBcn",
     "label": "Native birds in Barcelona, 2005–2022",
     "value": "−35 %",
     "context": "Exotic and feral: +40 %"
    },
    {
     "id": "sparrow",
     "label": "House sparrow in Barcelona, 2005–2022",
     "value": "−60 %",
     "context": "Multifactorial cause; the parakeet is a possible factor, not proven"
    },
    {
     "id": "cropLoss",
     "label": "Highest mean harvest loss (pear, Baix Llobregat)",
     "value": "36.6 %",
     "context": "Maize: 28.1 %. 2001 data"
    },
    {
     "id": "chlamydia",
     "label": "Parakeets with Chlamydia psittaci (Madrid)",
     "value": "23.8 %",
     "context": "5 of 21 birds; no data for Barcelona"
    },
    {
     "id": "spendInvasive",
     "label": "Declared spending on all invasive species, Catalonia 2021–2022",
     "value": "4.7 M€",
     "context": "No breakdown for the parakeet"
    },
    {
     "id": "spendParakeet",
     "label": "Specific public spending on the parakeet (Catalonia / AMB)",
     "value": "No public figure",
     "context": "No consolidated figure; it can be requested through the Portal de Transparència"
    }
   ],
   "tables": [],
   "series": [],
   "callouts": [],
   "glossary": [],
   "sourceGroups": []
  },
  {
   "id": "population",
   "title": "Population and nests",
   "intro": "Barcelona has one of the highest densities of monk parakeets in Europe. Between the 2001 and 2022 censuses the population grew on average by 7.4 % a year, which is equivalent to doubling every 9.7 years.",
   "kpis": [],
   "tables": [
    {
     "id": "bcnPopulation",
     "title": "Monk parakeet population in the city of Barcelona",
     "intro": "",
     "cols": [
      "Year",
      "Individuals",
      "Interval",
      "Data type",
      "Source"
     ],
     "rows": [
      [
       "1994",
       "850",
       "—",
       "Estimate",
       "Domènech, Carrillo & Senar 2003 (Rev. Catalana d'Ornitologia 20)"
      ],
      [
       "2001",
       "1,441",
       "1,176–1,706",
       "Nest census (±265)",
       "Domènech, Carrillo & Senar 2003"
      ],
      [
       "2010",
       "2,700",
       "—",
       "ASPB census",
       "ASPB, T. Montalvo (pers. comm.) in Informe Seguiment d'Ocells BCN 2021"
      ],
      [
       "2015",
       "5,000",
       "—",
       "ASPB / SEO/BirdLife census",
       "Molina et al. 2016, SEO/BirdLife"
      ],
      [
       "2022",
       "6,444",
       "5,995–6,893",
       "Nest and camera census (±449)",
       "Rewinding the invasion history of monk parakeets in Barcelona 1976-2022 (ABC 47.1, 2024)"
      ],
      [
       "2025",
       "11,000",
       "—",
       "Model projection (not a census)",
       "Senar 2021, Recomanacions per a la gestió de la cotorra de pit gris (cited in elCugatenc, 2026)"
      ]
     ],
     "notes": [],
     "sources": [
      "population"
     ]
    },
    {
     "id": "scale",
     "title": "Scale: Barcelona, Catalonia and Spain",
     "intro": "",
     "cols": [
      "Area",
      "Year",
      "Measure",
      "Value",
      "Source"
     ],
     "rows": [
      [
       "Barcelona",
       "2022",
       "Individuals",
       "6,444",
       "ABC 47.1 (2024)"
      ],
      [
       "Barcelona",
       "c. 2015",
       "Breeding pairs",
       "2,000",
       "Atles dels ocells nidificants de Barcelona (Anton et al. 2017)"
      ],
      [
       "Barcelona",
       "1992",
       "Nests",
       "246",
       "TOT Barcelona (data from the Dept. de Zoonosi)"
      ],
      [
       "Barcelona",
       "2001",
       "Nests",
       "313",
       "Domènech et al. 2003"
      ],
      [
       "Catalonia",
       "2001",
       "Nests",
       "492",
       "Domènech et al. 2003"
      ],
      [
       "Catalonia",
       "2001",
       "Individuals",
       "1,807–2,591",
       "Domènech et al. 2003 (2,199 ± 392)"
      ],
      [
       "Catalonia",
       "undated (SIOC)",
       "Pairs",
       "5,000–6,000",
       "SIOC, Institut Català d'Ornitologia"
      ],
      [
       "Spain",
       "2016",
       "Individuals",
       "18,980–21,455",
       "López et al. 2023, Front. Vet. Sci."
      ],
      [
       "Madrid (reference)",
       "2019",
       "Individuals",
       "12,975",
       "SEO/BirdLife census used by Madrid City Council"
      ],
      [
       "Madrid (reference)",
       "2019",
       "Nests",
       "4,408",
       "SEO/BirdLife census used by Madrid City Council"
      ]
     ],
     "notes": ["No nest count for Barcelona with a figure has been published since 2001, nor a complete census of the AMB municipality by municipality."],
     "sources": [
      "population"
     ]
    }
   ],
   "series": [
    {
     "id": "bcnPopulationSeries",
     "title": "Monk parakeet population in the city of Barcelona",
     "unit": "individuals",
     "x": "year",
     "sources": [
      "population"
     ],
     "points": [
      {
       "year": 1994,
       "value": 850,
       "low": null,
       "high": null,
       "type": "estimate",
       "projection": false
      },
      {
       "year": 2001,
       "value": 1441,
       "low": 1176,
       "high": 1706,
       "type": "nestCensus",
       "projection": false
      },
      {
       "year": 2010,
       "value": 2700,
       "low": null,
       "high": null,
       "type": "aspbCensus",
       "projection": false
      },
      {
       "year": 2015,
       "value": 5000,
       "low": null,
       "high": null,
       "type": "aspbSeoCensus",
       "projection": false
      },
      {
       "year": 2022,
       "value": 6444,
       "low": 5995,
       "high": 6893,
       "type": "nestCameraCensus",
       "projection": false
      }
     ]
    },
    {
     "id": "scaleIndividuals",
     "note": "Catalonia 2001: mean of 2,199 ± 392 individuals (1,807–2,591). The bar marks the mean and the line the interval.",
     "title": "Individuals by area and census",
     "group": "Scale",
     "unit": "individuals",
     "x": "label",
     "sources": [
      "population"
     ],
     "points": [
      {
       "label": "Barcelona 2022",
       "value": 6444,
       "low": null,
       "high": null
      },
      {
       "label": "Catalonia 2001",
       "value": 2199,
       "low": 1807,
       "high": 2591
      },
      {
       "label": "Spain 2016",
       "value": null,
       "low": 18980,
       "high": 21455
      },
      {
       "label": "Madrid (reference) 2019",
       "value": 12975,
       "low": null,
       "high": null
      }
     ]
    },
    {
     "id": "scaleNests",
     "title": "Nests by area and year",
     "group": "Scale",
     "unit": "count",
     "x": "label",
     "sources": [
      "population"
     ],
     "points": [
      {
       "label": "Barcelona 1992",
       "value": 246
      },
      {
       "label": "Barcelona 2001",
       "value": 313
      },
      {
       "label": "Catalonia 2001",
       "value": 492
      },
      {
       "label": "Madrid (reference) 2019",
       "value": 4408
      }
     ]
    },
    {
     "id": "scalePairs",
     "title": "Pairs by area",
     "group": "Scale",
     "unit": "count",
     "x": "label",
     "sources": [
      "population"
     ],
     "points": [
      {
       "label": "Barcelona c. 2015",
       "value": 2000,
       "low": null,
       "high": null
      },
      {
       "label": "Catalonia undated (SIOC)",
       "value": null,
       "low": 5000,
       "high": 6000
      }
     ]
    }
   ],
   "callouts": [{"kind":"warning","title":"Caution with the projection of 11,000 parakeets in 2025.","text":"It is not a census. The figure is attributed to a report that J. C. Senar (Museu de Ciències Naturals de Barcelona) prepared for the Ajuntament in 2021 (Recomanacions per a la gestió de la cotorra de pit gris a la ciutat de Barcelona), as cited by the press. The original report could not be consulted, so its base year and parameters are unknown. According to the newspaper Ara, the same report forecasts about 20,000 parakeets in 2031 without intervention. Going from 11,000 to 20,000 in six years means growing 10.5 % a year, compared with the 7.4 % observed between the 2001 and 2022 censuses. At the observed rate, there would be about 8,000 parakeets in 2025. It should not be cited as real data until there is a new census or the original report is consulted. That is why the chart shows only censuses and estimates."}],
   "glossary": [],
   "sourceGroups": []
  },
  {
   "id": "species",
   "title": "Native species",
   "intro": "",
   "kpis": [],
   "tables": [
    {
     "id": "socc",
     "title": "Catalonia: the parakeet grows and several common birds decline",
     "intro": "Mean annual change of each species according to the Catalan Common Bird Survey (SOCC). In brackets, the SOCC trend category.",
     "cols": [
      "Species",
      "Origin",
      "Spring, trend since 2002",
      "Spring, last 10 years",
      "Winter, trend since 2002",
      "Winter, last 10 years"
     ],
     "rows": [
      [
       "Monk parakeet (Myiopsitta monachus)",
       "Invasive exotic",
       "+5.2 % (moderate increase)",
       "+6.2 % (moderate increase)",
       "+4.3 % (moderate increase)",
       "+3.7 % (moderate increase)"
      ],
      [
       "Rose-ringed parakeet (Psittacula krameri)",
       "Invasive exotic",
       "+9.4 % (strong increase)",
       "+8.2 % (moderate increase)",
       "+9.7 % (strong increase)",
       "+14.7 % (strong increase)"
      ],
      [
       "House sparrow (Passer domesticus)",
       "Native",
       "−1.5 % (moderate decline)",
       "+0.2 % (stable)",
       "−1.8 % (moderate decline)",
       "−0.3 % (stable)"
      ],
      [
       "Common blackbird (Turdus merula)",
       "Native",
       "+0.3 % (moderate increase)",
       "+0.7 % (stable)",
       "−0.5 % (moderate decline)",
       "−1.3 % (moderate decline)"
      ],
      [
       "Eurasian magpie (Pica pica)",
       "Native",
       "−2 % (moderate decline)",
       "−2.3 % (moderate decline)",
       "−1.6 % (moderate decline)",
       "−1.3 % (moderate decline)"
      ],
      [
       "Starlings (Sturnus unicolor / vulgaris)",
       "Native",
       "−0.8 % (moderate decline)",
       "−1.6 % (stable)",
       "+1 % (stable)",
       "−4.2 % (moderate decline)"
      ],
      [
       "European robin (Erithacus rubecula)",
       "Native",
       "+1.4 % (moderate increase)",
       "+0.2 % (stable)",
       "−0.2 % (stable)",
       "−0.9 % (moderate decline)"
      ],
      [
       "European goldfinch (Carduelis carduelis)",
       "Native",
       "−0.3 % (stable)",
       "−0.2 % (stable)",
       "−0.7 % (moderate decline)",
       "+0.2 % (stable)"
      ],
      [
       "European greenfinch (Chloris chloris)",
       "Native",
       "−0.7 % (moderate decline)",
       "+0.1 % (stable)",
       "−1.2 % (moderate decline)",
       "−2 % (stable)"
      ],
      [
       "European serin (Serinus serinus)",
       "Native",
       "−0.3 % (stable)",
       "+1.4 % (moderate increase)",
       "+0.3 % (stable)",
       "+0.9 % (stable)"
      ],
      [
       "Common wood pigeon (Columba palumbus)",
       "Native",
       "+2.3 % (moderate increase)",
       "+2.2 % (moderate increase)",
       "+0.8 % (moderate increase)",
       "+3.1 % (moderate increase)"
      ],
      [
       "Eurasian collared dove (Streptopelia decaocto)",
       "Native",
       "+1.5 % (moderate increase)",
       "+1 % (stable)",
       "+0.4 % (stable)",
       "−1.4 % (stable)"
      ],
      [
       "Feral pigeon (Columba livia)",
       "Feral domestic",
       "−1.1 % (moderate decline)",
       "+3 % (moderate increase)",
       "−0.6 % (stable)",
       "+4.1 % (moderate increase)"
      ],
      [
       "Common swift (Apus apus)",
       "Native",
       "−2.8 % (moderate decline)",
       "−1.5 % (stable)",
       "—",
       "—"
      ]
     ],
     "notes": [],
     "sources": [
      "species"
     ]
    },
    {
     "id": "bcnIndex",
     "title": "Barcelona: native birds fall more than in the rest of Catalonia",
     "intro": "Bird abundance index in the city (2005 = 1). Native birds changed by −35 % and exotic and feral birds, which include the pigeon, by +40 %. In Catalonia as a whole native birds remain stable, which points to causes specific to the city.",
     "cols": [
      "Group",
      "Index 2005",
      "Index 2022",
      "Change"
     ],
     "rows": [
      [
       "Native birds",
       "1.00",
       "0.65",
       "−35 %"
      ],
      [
       "Exotic and feral",
       "1.00",
       "1.40",
       "+40 %"
      ]
     ],
     "notes": [],
     "sources": [
      "species"
     ]
    },
    {
     "id": "bcnSpecies",
     "title": "Species monitored in the city of Barcelona",
     "intro": "",
     "cols": [
      "Species",
      "Origin",
      "Pairs (approx.)",
      "Spring 2005–2021",
      "Winter 2005–2021",
      "Note"
     ],
     "rows": [
      [
       "House sparrow",
       "Native",
       "6,300",
       "Moderate decline",
       "Moderate decline",
       "−60 % between 2005 and 2022"
      ],
      [
       "Common blackbird",
       "Native",
       "3,000",
       "Moderate decline",
       "Moderate decline",
       "In Catalonia, stable or slight rise in spring"
      ],
      [
       "Eurasian magpie",
       "Native",
       "—",
       "Stable",
       "Stable",
       "In Catalonia, moderate decline"
      ],
      [
       "Common swift",
       "Native",
       "3,000",
       "Moderate decline",
       "Absent in winter",
       ""
      ],
      [
       "Common wood pigeon",
       "Native",
       "3,000",
       "Strong increase",
       "Moderate increase",
       "Colonised the city around 2005"
      ],
      [
       "Eurasian collared dove",
       "Native",
       "3,000",
       "Moderate increase",
       "Moderate increase",
       "Colonised the city after 1980"
      ],
      [
       "Monk parakeet",
       "Invasive exotic",
       "2,000",
       "Moderate increase",
       "Stable",
       "9th most abundant species in the city"
      ],
      [
       "Rose-ringed parakeet",
       "Invasive exotic",
       "170",
       "Moderate increase",
       "Moderate increase",
       "No control measures"
      ],
      [
       "Feral pigeon",
       "Feral domestic",
       "—",
       "Moderate decline",
       "Moderate decline",
       "About 113,000 individuals (2018)"
      ]
     ],
     "notes": [],
     "sources": [
      "species"
     ]
    }
   ],
   "series": [
    {
     "id": "soccTrends",
     "title": "Mean annual change by species (SOCC, Catalonia)",
     "unit": "percentPerYear",
     "x": "label",
     "sources": [
      "species"
     ],
     "points": [
      {
       "label": "Monk parakeet",
       "scientific": "Myiopsitta monachus",
       "origin": "inv",
       "springSince2002": 5.2,
       "springLast10": 6.2,
       "winterSince2002": 4.3,
       "winterLast10": 3.7,
       "springSince2002Cat": "am",
       "springLast10Cat": "am",
       "winterSince2002Cat": "am",
       "winterLast10Cat": "am"
      },
      {
       "label": "Rose-ringed parakeet",
       "scientific": "Psittacula krameri",
       "origin": "inv",
       "springSince2002": 9.4,
       "springLast10": 8.2,
       "winterSince2002": 9.7,
       "winterLast10": 14.7,
       "springSince2002Cat": "af",
       "springLast10Cat": "am",
       "winterSince2002Cat": "af",
       "winterLast10Cat": "af"
      },
      {
       "label": "House sparrow",
       "scientific": "Passer domesticus",
       "origin": "nat",
       "springSince2002": -1.5,
       "springLast10": 0.2,
       "winterSince2002": -1.8,
       "winterLast10": -0.3,
       "springSince2002Cat": "dm",
       "springLast10Cat": "e",
       "winterSince2002Cat": "dm",
       "winterLast10Cat": "e"
      },
      {
       "label": "Common blackbird",
       "scientific": "Turdus merula",
       "origin": "nat",
       "springSince2002": 0.3,
       "springLast10": 0.7,
       "winterSince2002": -0.5,
       "winterLast10": -1.3,
       "springSince2002Cat": "am",
       "springLast10Cat": "e",
       "winterSince2002Cat": "dm",
       "winterLast10Cat": "dm"
      },
      {
       "label": "Eurasian magpie",
       "scientific": "Pica pica",
       "origin": "nat",
       "springSince2002": -2,
       "springLast10": -2.3,
       "winterSince2002": -1.6,
       "winterLast10": -1.3,
       "springSince2002Cat": "dm",
       "springLast10Cat": "dm",
       "winterSince2002Cat": "dm",
       "winterLast10Cat": "dm"
      },
      {
       "label": "Starlings",
       "scientific": "Sturnus unicolor / vulgaris",
       "origin": "nat",
       "springSince2002": -0.8,
       "springLast10": -1.6,
       "winterSince2002": 1,
       "winterLast10": -4.2,
       "springSince2002Cat": "dm",
       "springLast10Cat": "e",
       "winterSince2002Cat": "e",
       "winterLast10Cat": "dm"
      },
      {
       "label": "European robin",
       "scientific": "Erithacus rubecula",
       "origin": "nat",
       "springSince2002": 1.4,
       "springLast10": 0.2,
       "winterSince2002": -0.2,
       "winterLast10": -0.9,
       "springSince2002Cat": "am",
       "springLast10Cat": "e",
       "winterSince2002Cat": "e",
       "winterLast10Cat": "dm"
      },
      {
       "label": "European goldfinch",
       "scientific": "Carduelis carduelis",
       "origin": "nat",
       "springSince2002": -0.3,
       "springLast10": -0.2,
       "winterSince2002": -0.7,
       "winterLast10": 0.2,
       "springSince2002Cat": "e",
       "springLast10Cat": "e",
       "winterSince2002Cat": "dm",
       "winterLast10Cat": "e"
      },
      {
       "label": "European greenfinch",
       "scientific": "Chloris chloris",
       "origin": "nat",
       "springSince2002": -0.7,
       "springLast10": 0.1,
       "winterSince2002": -1.2,
       "winterLast10": -2,
       "springSince2002Cat": "dm",
       "springLast10Cat": "e",
       "winterSince2002Cat": "dm",
       "winterLast10Cat": "e"
      },
      {
       "label": "European serin",
       "scientific": "Serinus serinus",
       "origin": "nat",
       "springSince2002": -0.3,
       "springLast10": 1.4,
       "winterSince2002": 0.3,
       "winterLast10": 0.9,
       "springSince2002Cat": "e",
       "springLast10Cat": "am",
       "winterSince2002Cat": "e",
       "winterLast10Cat": "e"
      },
      {
       "label": "Common wood pigeon",
       "scientific": "Columba palumbus",
       "origin": "nat",
       "springSince2002": 2.3,
       "springLast10": 2.2,
       "winterSince2002": 0.8,
       "winterLast10": 3.1,
       "springSince2002Cat": "am",
       "springLast10Cat": "am",
       "winterSince2002Cat": "am",
       "winterLast10Cat": "am"
      },
      {
       "label": "Eurasian collared dove",
       "scientific": "Streptopelia decaocto",
       "origin": "nat",
       "springSince2002": 1.5,
       "springLast10": 1,
       "winterSince2002": 0.4,
       "winterLast10": -1.4,
       "springSince2002Cat": "am",
       "springLast10Cat": "e",
       "winterSince2002Cat": "e",
       "winterLast10Cat": "e"
      },
      {
       "label": "Feral pigeon",
       "scientific": "Columba livia",
       "origin": "fer",
       "springSince2002": -1.1,
       "springLast10": 3,
       "winterSince2002": -0.6,
       "winterLast10": 4.1,
       "springSince2002Cat": "dm",
       "springLast10Cat": "am",
       "winterSince2002Cat": "e",
       "winterLast10Cat": "am"
      },
      {
       "label": "Common swift",
       "scientific": "Apus apus",
       "origin": "nat",
       "springSince2002": -2.8,
       "springLast10": -1.5,
       "winterSince2002": null,
       "winterLast10": null,
       "springSince2002Cat": "dm",
       "springLast10Cat": "e",
       "winterSince2002Cat": null,
       "winterLast10Cat": null
      }
     ]
    },
    {
     "id": "bcnBirdIndex",
     "title": "Bird abundance index in Barcelona (2005 = 1)",
     "unit": "index",
     "x": "year",
     "sources": [
      "species"
     ],
     "points": [
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2005,
       "value": 1
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2006,
       "value": 1.04
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2007,
       "value": 1.09
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2008,
       "value": 0.95
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2009,
       "value": 0.98
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2010,
       "value": 0.96
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2011,
       "value": 0.99
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2012,
       "value": 0.82
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2013,
       "value": 0.79
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2014,
       "value": 0.79
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2015,
       "value": 0.87
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2016,
       "value": 0.75
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2017,
       "value": 0.73
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2018,
       "value": 0.66
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2019,
       "value": 0.72
      },
      {
       "group": "Native",
       "label": "Native birds",
       "year": 2022,
       "value": 0.65
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2005,
       "value": 1
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2006,
       "value": 1.09
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2007,
       "value": 1.07
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2008,
       "value": 1.05
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2009,
       "value": 1.12
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2010,
       "value": 1.03
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2011,
       "value": 1.06
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2012,
       "value": 1.01
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2013,
       "value": 1.15
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2014,
       "value": 1.27
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2015,
       "value": 1.22
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2016,
       "value": 1.14
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2017,
       "value": 1.24
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2018,
       "value": 1.36
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2019,
       "value": 1.44
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral",
       "year": 2022,
       "value": 1.4
      }
     ],
     "trend": [
      {
       "group": "Native",
       "label": "Native trend",
       "from": 2005,
       "to": 2019,
       "start": 1.06875,
       "end": 0.68325
      },
      {
       "group": "Exotic and feral",
       "label": "Exotic and feral trend",
       "from": 2005,
       "to": 2019,
       "start": 0.9805,
       "end": 1.3195
      }
     ],
     "trendNote": "Linear trend calculated from SOCC 2021 values (2005–2019)"
    },
    {
     "id": "bcnSpeciesPairs",
     "title": "Approximate pairs by species in Barcelona",
     "unit": "count",
     "x": "label",
     "sources": [
      "species"
     ],
     "points": [
      {
       "label": "House sparrow",
       "origin": "nat",
       "value": 6300
      },
      {
       "label": "Common blackbird",
       "origin": "nat",
       "value": 3000
      },
      {
       "label": "Eurasian magpie",
       "origin": "nat",
       "value": null
      },
      {
       "label": "Common swift",
       "origin": "nat",
       "value": 3000
      },
      {
       "label": "Common wood pigeon",
       "origin": "nat",
       "value": 3000
      },
      {
       "label": "Eurasian collared dove",
       "origin": "nat",
       "value": 3000
      },
      {
       "label": "Monk parakeet",
       "origin": "inv",
       "value": 2000
      },
      {
       "label": "Rose-ringed parakeet",
       "origin": "inv",
       "value": 170
      },
      {
       "label": "Feral pigeon",
       "origin": "fer",
       "value": null
      }
     ]
    }
   ],
   "callouts": [{"kind":"warning","title":"Correlation is not causation.","text":"The municipal report cites competition with parakeets, collared doves and wood pigeons as a possible factor in the decline of the sparrow and the blackbird, along with cats, human disturbance in parks and the loss of cavities for nesting. It also documents that pigeons, sparrows and even a scops owl make use of parakeet nests."}],
   "glossary": [],
   "sourceGroups": []
  },
  {
   "id": "crops",
   "title": "Crops",
   "intro": "",
   "kpis": [],
   "tables": [
    {
     "id": "cropLosses",
     "title": "Measured losses in Baix Llobregat crops",
     "intro": "Only study with field data in the AMB: El Prat, Viladecans, Gavà and Sant Boi, 1,024 ha. Sampling from June to September 2001.",
     "cols": [
      "Crop",
      "Mean loss",
      "Range between fields",
      "Sample"
     ],
     "rows": [
      [
       "Pear",
       "36.6 %",
       "20–69 %",
       "6 of 25 trees"
      ],
      [
       "Round plum",
       "35.8 %",
       "7–65 %",
       "2 of 8 trees"
      ],
      [
       "Maize",
       "28.1 %",
       "0–74 %",
       "6,310 of 34,700 plants (ears)"
      ],
      [
       "Persimmon",
       "17.1 %",
       "9–29 %",
       "6 of 6 trees"
      ],
      [
       "Red plum",
       "8.8 %",
       "0–32 %",
       "8 of 150 trees"
      ],
      [
       "Quince",
       "6.5 %",
       "6.3–6.7 %",
       "2 of 2 trees"
      ],
      [
       "Tomato",
       "0.42 %",
       "0–5 %",
       "4,348 of 458,751 plants (tomatoes)"
      ]
     ],
     "notes": [],
     "sources": [
      "crops"
     ]
    },
    {
     "id": "cropIndicators",
     "title": "Crop damage indicators",
     "intro": "",
     "cols": [
      "Indicator",
      "Value",
      "Note"
     ],
     "rows": [
      [
       "Maize fields attacked",
       "75 %",
       "9,748 damaged ears estimated"
      ],
      [
       "Tomato fields attacked",
       "38 %",
       "36,931 damaged tomatoes estimated"
      ],
      [
       "Losses from all wildlife in the Parc Agrari (Unió de Pagesos, 2004)",
       "2.5–3 M€",
       "Does not separate the parakeet's share"
      ],
      [
       "Reported wait for a control permit (Reus, 2026)",
       "45 days",
       "According to Unió de Pagesos"
      ]
     ],
     "notes": [],
     "sources": [
      "crops"
     ]
    },
    {
     "id": "parcAgrariCaptures",
     "title": "Captures authorised for damage in the Parc Agrari (2017)",
     "intro": "The parakeet is already among the species captured to protect the crops of the Parc Agrari, which has 2,938 ha and 324 active farms.",
     "cols": [
      "Species",
      "Captures"
     ],
     "rows": [
      [
       "Common wood pigeon",
       "1,293"
      ],
      [
       "Starling",
       "970"
      ],
      [
       "Rabbit",
       "441"
      ],
      [
       "Eurasian magpie",
       "425"
      ],
      [
       "Monk parakeet",
       "393"
      ],
      [
       "Wild boar",
       "56"
      ],
      [
       "Pheasant",
       "54"
      ]
     ],
     "notes": [],
     "sources": [
      "crops"
     ]
    }
   ],
   "series": [
    {
     "id": "cropLossSeries",
     "title": "Mean harvest loss by crop (Baix Llobregat, 2001)",
     "unit": "percent",
     "x": "label",
     "sources": [
      "crops"
     ],
     "points": [
      {
       "label": "Pear",
       "mean": 36.6,
       "min": 20,
       "max": 69
      },
      {
       "label": "Round plum",
       "mean": 35.8,
       "min": 7,
       "max": 65
      },
      {
       "label": "Maize",
       "mean": 28.1,
       "min": 0,
       "max": 74
      },
      {
       "label": "Persimmon",
       "mean": 17.1,
       "min": 9,
       "max": 29
      },
      {
       "label": "Red plum",
       "mean": 8.8,
       "min": 0,
       "max": 32
      },
      {
       "label": "Quince",
       "mean": 6.5,
       "min": 6.3,
       "max": 6.7
      },
      {
       "label": "Tomato",
       "mean": 0.42,
       "min": 0,
       "max": 5
      }
     ],
     "group": "Crop damage"
    },
    {
     "id": "parcAgrariCaptureSeries",
     "title": "Captures authorised in the Parc Agrari (2017)",
     "unit": "count",
     "x": "label",
     "sources": [
      "crops"
     ],
     "points": [
      {
       "label": "Common wood pigeon",
       "value": 1293
      },
      {
       "label": "Starling",
       "value": 970
      },
      {
       "label": "Rabbit",
       "value": 441
      },
      {
       "label": "Eurasian magpie",
       "value": 425
      },
      {
       "label": "Monk parakeet",
       "value": 393
      },
      {
       "label": "Wild boar",
       "value": 56
      },
      {
       "label": "Pheasant",
       "value": 54
      }
     ]
    },
    {
     "id": "cropAttackSeries",
     "title": "Share of fields attacked",
     "group": "Crop damage",
     "unit": "percent",
     "x": "label",
     "sources": [
      "crops"
     ],
     "points": [
      {
       "label": "Maize fields attacked",
       "value": 75
      },
      {
       "label": "Tomato fields attacked",
       "value": 38
      }
     ]
    }
   ],
   "callouts": [{"kind":"info","title":"Data from 2001.","text":"The percentages were measured in 2001, when about 120 parakeets bred in the area. Today the population of Barcelona and the southern metropolitan area is several tens of times larger, so current damage is probably higher. In 2026 damage has spread to almond and hazelnut trees in the Camp de Tarragona, with no published figures."}],
   "glossary": [],
   "sourceGroups": []
  },
  {
   "id": "health",
   "title": "Parasites and diseases",
   "intro": "Prevalence in captured birds. Samples are small: with 21 birds, the confidence interval is very wide.",
   "kpis": [],
   "tables": [
    {
     "id": "prevalence",
     "title": "Prevalence in captured birds",
     "intro": "",
     "cols": [
      "Agent",
      "Type",
      "Species",
      "City",
      "Prevalence",
      "95 % CI",
      "Positives",
      "Sample",
      "Note"
     ],
     "rows": [
      [
       "Chlamydia psittaci",
       "Zoonotic bacterium (psittacosis)",
       "Monk parakeet",
       "Madrid",
       "23.8 %",
       "10.6–45.1 %",
       "5",
       "21",
       "Genotypes indicating transmission from urban pigeons"
      ],
      [
       "Enteropathogenic E. coli (EPEC)",
       "Zoonotic bacterium",
       "Monk parakeet",
       "Madrid",
       "9.5 %",
       "2.7–28.9 %",
       "2",
       "21",
       ""
      ],
      [
       "Salmonella spp.",
       "Zoonotic bacterium",
       "Monk parakeet",
       "Madrid",
       "0 %",
       "0–15.5 %",
       "0",
       "21",
       "Not detected"
      ],
      [
       "Campylobacter jejuni",
       "Zoonotic bacterium",
       "Monk parakeet",
       "Madrid",
       "0 %",
       "0–15.5 %",
       "0",
       "21",
       "Not detected"
      ],
      [
       "Leucocytozoon",
       "Blood parasite",
       "Monk parakeet",
       "Barcelona",
       "3.1 %",
       "1.3–7.1 %",
       "5",
       "160",
       "Only health study done in Barcelona with blood samples"
      ],
      [
       "Plasmodium (avian malaria)",
       "Blood parasite",
       "Monk parakeet",
       "Barcelona",
       "0 %",
       "0–2.3 %",
       "0",
       "160",
       "Does not develop in the parakeet"
      ],
      [
       "Haemoproteus",
       "Blood parasite",
       "Monk parakeet",
       "Barcelona",
       "0 %",
       "0–2.3 %",
       "0",
       "160",
       ""
      ],
      [
       "Avian influenza (AIV)",
       "Virus",
       "Rose-ringed parakeet",
       "Seville",
       "13.3 %",
       "6.9–24.2 %",
       "8",
       "60",
       "Not detected in the monk parakeets of Madrid"
      ],
      [
       "Newcastle (NDV)",
       "Virus",
       "Rose-ringed parakeet",
       "Seville",
       "3.3 %",
       "0.9–11.4 %",
       "2",
       "60",
       ""
      ],
      [
       "Circovirus BFDV (beak and feather disease)",
       "Virus",
       "Monk parakeet and rose-ringed parakeet",
       "Seville",
       "—",
       "—",
       "—",
       "—",
       "Between 33 % and 37 % depending on the year (2015–2018); no transmission observed to native birds"
      ],
      [
       "Ornithonyssus bursa mite (specific to the parakeet) on pigeons",
       "Ectoparasite",
       "Domestic pigeon (cross-infection)",
       "Barcelona",
       "10 %",
       "—",
       "—",
       "—",
       "Can bite people; the load grows with parakeet density"
      ],
      [
       "Pigeon parasites on parakeets",
       "Ectoparasite",
       "Monk parakeet",
       "Barcelona",
       "0.66 %",
       "—",
       "—",
       "—",
       ""
      ],
      [
       "Culex pipiens bites (vector of West Nile virus) on parakeets",
       "Role as host",
       "Monk parakeet",
       "Barcelona",
       "9.5 %",
       "—",
       "—",
       "—",
       "% of the mosquito's blood meals"
      ],
      [
       "Novel Dependoparvovirus",
       "Virus",
       "Monk parakeet",
       "Madrid",
       "—",
       "—",
       "—",
       "28",
       "Detected by metagenomics; prevalence not published"
      ]
     ],
     "notes": [],
     "sources": [
      "health"
     ]
    }
   ],
   "series": [
    {
     "id": "prevalenceSeries",
     "title": "Prevalence by agent (with 95 % CI)",
     "unit": "percent",
     "x": "label",
     "sources": [
      "health"
     ],
     "points": [
      {
       "label": "Chlamydia psittaci",
       "city": "Madrid",
       "value": 23.8,
       "low": 10.6,
       "high": 45.1,
       "positives": 5,
       "sample": 21
      },
      {
       "label": "Enteropathogenic E. coli (EPEC)",
       "city": "Madrid",
       "value": 9.5,
       "low": 2.7,
       "high": 28.9,
       "positives": 2,
       "sample": 21
      },
      {
       "label": "Salmonella spp.",
       "city": "Madrid",
       "value": 0,
       "low": 0,
       "high": 15.5,
       "positives": 0,
       "sample": 21
      },
      {
       "label": "Campylobacter jejuni",
       "city": "Madrid",
       "value": 0,
       "low": 0,
       "high": 15.5,
       "positives": 0,
       "sample": 21
      },
      {
       "label": "Leucocytozoon",
       "city": "Barcelona",
       "value": 3.1,
       "low": 1.3,
       "high": 7.1,
       "positives": 5,
       "sample": 160
      },
      {
       "label": "Plasmodium (avian malaria)",
       "city": "Barcelona",
       "value": 0,
       "low": 0,
       "high": 2.3,
       "positives": 0,
       "sample": 160
      },
      {
       "label": "Haemoproteus",
       "city": "Barcelona",
       "value": 0,
       "low": 0,
       "high": 2.3,
       "positives": 0,
       "sample": 160
      },
      {
       "label": "Avian influenza (AIV)",
       "city": "Sevilla",
       "value": 13.3,
       "low": 6.9,
       "high": 24.2,
       "positives": 8,
       "sample": 60
      },
      {
       "label": "Newcastle (NDV)",
       "city": "Sevilla",
       "value": 3.3,
       "low": 0.9,
       "high": 11.4,
       "positives": 2,
       "sample": 60
      },
      {
       "label": "Ornithonyssus bursa mite (specific to the parakeet) on pigeons",
       "city": "Barcelona",
       "value": 10,
       "low": null,
       "high": null,
       "positives": null,
       "sample": null
      },
      {
       "label": "Pigeon parasites on parakeets",
       "city": "Barcelona",
       "value": 0.66,
       "low": null,
       "high": null,
       "positives": null,
       "sample": null
      },
      {
       "label": "Culex pipiens bites (vector of West Nile virus) on parakeets",
       "city": "Barcelona",
       "value": 9.5,
       "low": null,
       "high": null,
       "positives": null,
       "sample": null
      }
     ]
    }
   ],
   "callouts": [{"kind":"info","title":"","text":"The most relevant figure for human health, Chlamydia psittaci (psittacosis), comes from Madrid. In Barcelona only studies of blood parasites and mites have been published. The parakeet's own mite appears in 10 % of the pigeons studied and can bite people."}],
   "glossary": [],
   "sourceGroups": []
  },
  {
   "id": "spending",
   "title": "Public spending",
   "intro": "",
   "kpis": [],
   "tables": [
    {
     "id": "spendPeriods",
     "title": "Declared spending on invasive species in Catalonia by period",
     "intro": "Sum of what the Generalitat, town councils, provincial councils, European funds and other bodies declared, for all invasive species. The parakeet has no budget line of its own.",
     "cols": [
      "Period",
      "Total declared",
      "Annual average",
      "Note"
     ],
     "rows": [
      [
       "2015–2018",
       "7.85 M€",
       "1.96 M€",
       "All administrations; the apple snail takes 70 %"
      ],
      [
       "2019–2020",
       "12.78 M€",
       "6.39 M€",
       "The apple snail takes 43.7 %"
      ],
      [
       "2021–2022",
       "4.7 M€",
       "2.35 M€",
       "85 % goes to control"
      ]
     ],
     "notes": [],
     "sources": [
      "spend"
     ]
    },
    {
     "id": "spendItems",
     "title": "Declared spending on invasive species in Catalonia by item",
     "intro": "",
     "cols": [
      "Item",
      "Amount",
      "Note"
     ],
     "rows": [
      [
       "Departament, invasive species control 2022",
       "923,230 €",
       "Executed"
      ],
      [
       "Departament, invasive species control 2023",
       "2 M€",
       "Announced; no breakdown published"
      ],
      [
       "Generalitat contribution 2015–2018",
       "> 3 M€",
       "Of the total declared in that period"
      ]
     ],
     "notes": [],
     "sources": [
      "spend"
     ]
    },
    {
     "id": "spendByType",
     "title": "What it is spent on: control, almost nothing on monitoring (2015–2018)",
     "intro": "",
     "cols": [
      "Type of action",
      "% of spending"
     ],
     "rows": [
      [
       "Control",
       "95.1 %"
      ],
      [
       "Outreach",
       "2.8 %"
      ],
      [
       "Monitoring and surveillance",
       "1.3 %"
      ],
      [
       "Prevention",
       "0.60 %"
      ],
      [
       "Scientific study",
       "0.20 %"
      ]
     ],
     "notes": [],
     "sources": [
      "spend"
     ]
    },
    {
     "id": "contracts",
     "title": "Municipal parakeet control contracts",
     "intro": "The 2026 Barcelona contract is 4.7 times the 2021 one. Madrid's plan cost 41 times Barcelona's current contract.",
     "cols": [
      "Body",
      "Scope",
      "Period",
      "Subject",
      "Species",
      "Amount",
      "VAT",
      "Duration"
     ],
     "rows": [
      [
       "Ajuntament de Barcelona (Parcs i Jardins)",
       "AMB",
       "2021",
       "Removal of chicks and eggs from nests during pruning",
       "Monk parakeet",
       "14,850.00 €",
       "excl. VAT",
       "minor contract"
      ],
      [
       "Ajuntament de Barcelona (Parcs i Jardins)",
       "AMB",
       "2026",
       "Removal of nests, eggs and chicks in trees and palms",
       "Monk parakeet",
       "70,368.76 €",
       "excl. VAT",
       "not stated"
      ],
      [
       "Ajuntament de Sant Cugat del Vallès",
       "AMB",
       "2026–2029",
       "Urban bird control: capture, culling and nest removal",
       "Monk parakeet and pigeon",
       "143,245.92 €",
       "not stated",
       "3 years"
      ],
      [
       "Ajuntament de Torredembarra",
       "Rest of Catalonia",
       "until 2030",
       "Pigeon and parakeet control (lot 1)",
       "Pigeon and monk parakeet",
       "55,938.52 €",
       "awarded",
       "not stated"
      ],
      [
       "Ajuntament de Torredembarra",
       "Rest of Catalonia",
       "until 2030",
       "Pigeon and parakeet control (lot 2)",
       "Pigeon and monk parakeet",
       "13,522.49 €",
       "awarded",
       "not stated"
      ],
      [
       "Ayuntamiento de Madrid",
       "Reference",
       "2021–2023",
       "Comprehensive plan: captures, egg sterilisation, nest removal and health analysis",
       "Monk parakeet and rose-ringed parakeet",
       "2,900,000.00 €",
       "incl. VAT",
       "23 months"
      ],
      [
       "Ayuntamiento de Torrejón de Ardoz",
       "Reference",
       "2026–2029",
       "Urban wildlife control with annual population assessment",
       "Rabbit, pigeon, parakeet and Egyptian goose",
       "150,000.00 €",
       "maximum budget",
       "3 years"
      ]
     ],
     "notes": [],
     "sources": [
      "spend"
     ]
    }
   ],
   "series": [
    {
     "id": "spendPeriodsSeries",
     "title": "Declared spending on invasive species by period (Catalonia)",
     "unit": "MEUR",
     "x": "label",
     "sources": [
      "spend"
     ],
     "points": [
      {
       "label": "2015–2018",
       "total": 7.85,
       "annualAverage": 1.96
      },
      {
       "label": "2019–2020",
       "total": 12.78,
       "annualAverage": 6.39
      },
      {
       "label": "2021–2022",
       "total": 4.7,
       "annualAverage": 2.35
      }
     ]
    },
    {
     "id": "spendByTypeSeries",
     "title": "Spending split by type of action (2015–2018)",
     "unit": "percent",
     "x": "label",
     "sources": [
      "spend"
     ],
     "points": [
      {
       "id": "control",
       "label": "Control",
       "value": 95.1
      },
      {
       "id": "outreach",
       "label": "Outreach",
       "value": 2.8
      },
      {
       "id": "monitoring",
       "label": "Monitoring and surveillance",
       "value": 1.3
      },
      {
       "id": "prevention",
       "label": "Prevention",
       "value": 0.6
      },
      {
       "id": "science",
       "label": "Scientific study",
       "value": 0.2
      }
     ]
    },
    {
     "id": "contractsSeries",
     "title": "Amount of control contracts",
     "unit": "EUR",
     "x": "label",
     "sources": [
      "spend"
     ],
     "points": [
      {
       "label": "Ajuntament de Barcelona (Parcs i Jardins) 2021",
       "amount": 14850,
       "mark": "excl. VAT"
      },
      {
       "label": "Ajuntament de Barcelona (Parcs i Jardins) 2026",
       "amount": 70368.76,
       "mark": "excl. VAT"
      },
      {
       "label": "Ajuntament de Sant Cugat del Vallès 2026–2029",
       "amount": 143245.92,
       "mark": "not stated"
      },
      {
       "label": "Ajuntament de Torredembarra (lot 1)",
       "amount": 55938.52,
       "mark": "awarded"
      },
      {
       "label": "Ajuntament de Torredembarra (lot 2)",
       "amount": 13522.49,
       "mark": "awarded"
      },
      {
       "label": "Ayuntamiento de Madrid 2021–2023",
       "amount": 2900000,
       "mark": "incl. VAT"
      },
      {
       "label": "Ayuntamiento de Torrejón de Ardoz 2026–2029",
       "amount": 150000,
       "mark": "maximum budget"
      }
     ],
     "group": "Amounts in euros"
    },
    {
     "id": "spendItemsSeries",
     "title": "Spending items",
     "group": "Amounts in euros",
     "unit": "EUR",
     "x": "label",
     "sources": [
      "spend"
     ],
     "points": [
      {
       "label": "Departament, invasive species control 2022",
       "amount": 923230,
       "bound": null
      },
      {
       "label": "Departament, invasive species control 2023",
       "amount": 2000000,
       "bound": null
      },
      {
       "label": "Generalitat contribution 2015–2018",
       "amount": 3000000,
       "bound": "min"
      }
     ]
    }
   ],
   "callouts": [{"kind":"warning","title":"Nest removal is not counted.","text":"The official reports exclude the removal of parakeet nests carried out as part of tree maintenance, and in 2021–2022 the parakeet is among the actions whose amount cannot be determined. Real spending on the species is underestimated."}],
   "glossary": [],
   "sourceGroups": []
  },
  {
   "id": "other",
   "title": "Other metrics",
   "intro": "",
   "kpis": [],
   "tables": [
    {
     "id": "safety",
     "title": "Safety and coexistence",
     "intro": "",
     "cols": [
      "Indicator",
      "Value",
      "Note"
     ],
     "rows": [
      [
       "Maximum weight of a communal nest (Barcelona)",
       "200 kg",
       "On pines, cedars and palms, often weakened by the red palm weevil"
      ],
      [
       "Nests removed by the Ajuntament in one month (2021)",
       "118",
       "Due to fall risk, when pruning"
      ],
      [
       "Neighbour complaints in Madrid (2018–2021)",
       "1,139",
       "Barcelona does not publish this figure"
      ],
      [
       "Complaints in Sant Cugat over 12 years",
       "75",
       "Figure provided by the Plataforma Animalista"
      ]
     ],
     "notes": [],
     "sources": [
      "other"
     ]
    },
    {
     "id": "growthDrivers",
     "title": "What fuels the growth",
     "intro": "",
     "cols": [
      "Indicator",
      "Value",
      "Note"
     ],
     "rows": [
      [
       "Share of the diet that is food given by people",
       "40 %",
       "Estimate by J. C. Senar (Museu de Ciències Naturals)"
      ],
      [
       "Published doubling time (2003)",
       "9 years",
       "Calculated with the 2001–2022 censuses: 9.7 years"
      ]
     ],
     "notes": [],
     "sources": [
      "other"
     ]
    },
    {
     "id": "madridLessons",
     "title": "Lessons from Madrid (2021–2023 plan)",
     "intro": "",
     "cols": [
      "Indicator",
      "Value",
      "Note"
     ],
     "rows": [
      [
       "Budget",
       "2.9 M€",
       "VAT included, 23 months"
      ],
      [
       "Declared captures",
       "17,143",
       "More than the initial census of 12,975"
      ],
      [
       "Cost per parakeet captured",
       "169 €",
       "Budget divided by captures; the settled cost is not public"
      ],
      [
       "Population decline using its own figures",
       "23 %",
       "From 12,975 to 10,000; the City Council presented it as 30 %"
      ],
      [
       "Juveniles and initial adults removed (scientific study)",
       "87 %",
       "Population halved compared with doing nothing: 50 %"
      ],
      [
       "Shot with air rifle / eggs sterilised",
       "1,191 / 2,062",
       "No verifiable final census"
      ]
     ],
     "notes": [],
     "sources": [
      "other"
     ]
    },
    {
     "id": "coypu",
     "title": "A Catalan precedent that worked: the coypu",
     "intro": "",
     "cols": [
      "Indicator",
      "Value",
      "Note"
     ],
     "rows": [
      [
       "Increase in captures with the shock plan (Girona, 2023)",
       "+516 %",
       "Fixed crews, mapping and protocols"
      ],
      [
       "Population reduction in one year",
       "40 %",
       "With demographic monitoring by IRTA and UAB"
      ]
     ],
     "notes": [],
     "sources": [
      "other"
     ]
    }
   ],
   "series": [
    {
     "id": "complaintsSeries",
     "title": "Neighbour complaints",
     "unit": "count",
     "x": "label",
     "sources": [
      "other"
     ],
     "points": [
      {
       "label": "Neighbour complaints in Madrid (2018–2021)",
       "value": 1139
      },
      {
       "label": "Complaints in Sant Cugat over 12 years",
       "value": 75
      }
     ]
    },
    {
     "id": "madridCounts",
     "title": "Madrid plan: counts",
     "unit": "count",
     "x": "label",
     "sources": [
      "other"
     ],
     "points": [
      {
       "label": "Initial census",
       "value": 12975
      },
      {
       "label": "Declared captures",
       "value": 17143
      },
      {
       "label": "Shot with air rifle",
       "value": 1191
      },
      {
       "label": "Eggs sterilised",
       "value": 2062
      }
     ]
    },
    {
     "id": "madridPercent",
     "title": "Madrid plan: percentages",
     "unit": "percent",
     "x": "label",
     "sources": [
      "other"
     ],
     "points": [
      {
       "label": "Population decline, own figures",
       "value": 23
      },
      {
       "label": "Decline as presented by the City Council",
       "value": 30
      },
      {
       "label": "Juveniles and initial adults removed",
       "value": 87
      }
     ]
    },
    {
     "id": "coypuSeries",
     "title": "Coypu shock plan",
     "unit": "percent",
     "x": "label",
     "sources": [
      "other"
     ],
     "points": [
      {
       "label": "Increase in captures (Girona, 2023)",
       "value": 516
      },
      {
       "label": "Population reduction in one year",
       "value": 40
      }
     ]
    }
   ],
   "callouts": [],
   "glossary": [],
   "sourceGroups": []
  },
  {
   "id": "howToRead",
   "title": "How to read this data",
   "intro": "",
   "kpis": [],
   "tables": [],
   "series": [],
   "callouts": [],
   "glossary": [
    {
     "term": "SOCC",
     "text": "Catalan Common Bird Survey (ICO and Generalitat). The value is the mean percentage of annual change; \"since 2002\" is the long term and \"last 10 years\" the short term."
    },
    {
     "term": "Barcelona bird index",
     "text": "relative abundance with 2005 = 1, calculated over fixed routes in the city. Exotic and feral birds include the domestic pigeon."
    },
    {
     "term": "Confidence interval",
     "text": "95 % Wilson interval, calculated from positives and sample size."
    },
    {
     "term": "Annual growth",
     "text": "compound rate between the 2001 and 2022 Barcelona censuses."
    },
    {
     "term": "Own calculations",
     "text": "the annual growth, the doubling time, the confidence intervals, the annual average spending, the comparisons between contracts and the figures derived for Madrid (cost per capture, population decline) are calculated from published data; no source publishes them."
    },
    {
     "term": "",
     "text": "The figures for Madrid and Seville are shown as a reference because there are no equivalents for Barcelona or Catalonia."
    }
   ],
   "sourceGroups": []
  },
  {
   "id": "sources",
   "title": "Sources",
   "intro": "",
   "kpis": [],
   "tables": [],
   "series": [],
   "callouts": [],
   "glossary": [],
   "sourceGroups": [
    {
     "id": "population",
     "title": "Population and nests",
     "items": [
      {
       "title": "Domènech, J., Carrillo, J. & Senar, J. C. (2003). Censo de cotorras en Barcelona y Cataluña. Revista Catalana d'Ornitologia 20.",
       "url": null,
       "detail": "",
       "also": []
      },
      {
       "title": "Anton, M., Herrando, S., Garcia, D., Ferrer, X. & Cebrian, R. (2017). Atles dels ocells nidificants de Barcelona. Ajuntament de Barcelona.",
       "url": null,
       "detail": "",
       "also": []
      },
      {
       "title": "Molina, B. et al. (2016). La cotorra argentina en España, población reproductora en 2015 y método de censo. SEO/BirdLife.",
       "url": null,
       "detail": "",
       "also": []
      },
      {
       "title": "Rewinding the invasion history of monk parakeets in Barcelona city: 1976–2022. Animal Biodiversity and Conservation 47.1 (2024).",
       "url": "https://www.recercat.cat/handle/2072/537646",
       "detail": "",
       "also": []
      },
      {
       "title": "SIOC – Ficha de la cotorra argentina. Institut Català d'Ornitologia.",
       "url": "",
       "detail": "",
       "also": []
      },
      {
       "title": "Senar, J. C. (2021). Recomanacions per a la gestió de la cotorra de pit gris a la ciutat de Barcelona. Informe para el Ajuntament.",
       "url": null,
       "detail": "Not consulted directly; figures cited in elCugatenc and Ara, 25/04/2025.",
       "also": [
        {
         "title": "Ara, 25/04/2025",
         "url": "https://es.ara.cat/sociedad/barcelona/domadores-cotorras-ultimo-negocio-parque-ciutadella_1_5357748.html"
        }
       ]
      }
     ]
    },
    {
     "id": "species",
     "title": "Native species",
     "items": [
      {
       "title": "SOCC – Tendencias poblacionales. ICO / Generalitat de Catalunya.",
       "url": "https://socc.cat/socc/resultats/tendencies/",
       "detail": "",
       "also": []
      },
      {
       "title": "Ferrer, X. & Anton, M. (2021). Informe del seguiment d'ocells a la ciutat de Barcelona 2021. UB / ICO para el Ajuntament de Barcelona.",
       "url": "https://www.bcnregional.com/ObservatoriBiodiversitat/docs/SOCC_-2021.pdf",
       "detail": "",
       "also": []
      },
      {
       "title": "CatalunyaPress, 05/02/2024",
       "url": "https://www.catalunyapress.cat/article/barcelona/2024-02-05/4701462-superpoblacio-coloms-i-cotorres-barcelona-amenacen-resta-despcies-autctones",
       "detail": "bird index 2005–2022 and sparrow decline",
       "also": []
      }
     ]
    },
    {
     "id": "crops",
     "title": "Crops",
     "items": [
      {
       "title": "Senar, J. C., Domènech, J., Arroyo, L., Torre, I. & Gordo, O. (2016). An evaluation of monk parakeet damage to crops in the metropolitan area of Barcelona. Animal Biodiversity and Conservation 39.1: 141–145.",
       "url": "https://raco.cat/index.php/ABC/article/download/10.32800-abc.2016.39.0141/400034",
       "detail": "",
       "also": []
      },
      {
       "title": "Roda, R. (2017). Presentación del Consorci del Parc Agrari del Baix Llobregat. ICEA, Prada.",
       "url": "https://icea.iec.cat/wp-content/uploads/2017/10/170819_XXXII_Prada_07_Ramon_Roda_Presentacio.pdf",
       "detail": "",
       "also": []
      },
      {
       "title": "Unió de Pagesos, 11/08/2026",
       "url": "https://uniopagesos.cat/comunicat-de-premsa/demanem-a-ladministracio-que-sigui-resolutiva-a-lhora-datorgar-els-permisos-per-actuar-contra-els-danys-de-cotorra/",
       "detail": "damage and permits",
       "also": []
      }
     ]
    },
    {
     "id": "health",
     "title": "Parasites and diseases",
     "items": [
      {
       "title": "López, J. et al. (2023). Infectious agents present in monk parakeet and rose-ringed parakeet invasive species in the parks of Madrid and Seville. Frontiers in Veterinary Science 10:1162402.",
       "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10441216/",
       "detail": "",
       "also": []
      },
      {
       "title": "Martínez-de la Puente, J. et al. (2020). Do invasive mosquito and bird species alter avian malaria parasite transmission? Diversity 12:111.",
       "url": "https://bcnroc.ajuntament.barcelona.cat/items/7a3f52ba-0b04-4e8f-ba1c-f291062c8e50/full",
       "detail": "",
       "also": []
      },
      {
       "title": "Mori, E. et al. (2019). Ectoparasite sharing among native and invasive birds in a metropolitan area. Parasitology Research 118:399–409.",
       "url": "https://pubmed.ncbi.nlm.nih.gov/30565194",
       "detail": "",
       "also": []
      },
      {
       "title": "Apparent Lack of Circovirus Transmission from Invasive Parakeets to Native Birds. IJERPH (2022).",
       "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8953828/",
       "detail": "",
       "also": []
      },
      {
       "title": "A Novel Dependoparvovirus Identified in Cloacal Swabs of Monk Parakeet from Urban Areas of Spain. Viruses (2023).",
       "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10145644/",
       "detail": "",
       "also": []
      }
     ]
    },
    {
     "id": "spend",
     "title": "Public spending and contracts",
     "items": [
      {
       "title": "Generalitat de Catalunya. Memoria de actuaciones sobre especies exóticas invasoras 2015–2018.",
       "url": "https://regions4.org/wp-content/uploads/2019/06/Memoria-CASTELLA-EEI-DTES-2015-2018.pdf",
       "detail": "",
       "also": []
      },
      {
       "title": "Generalitat de Catalunya. Memoria EEI 2019–2020.",
       "url": "https://mediambient.gencat.cat/web/.content/home/ambits_dactuacio/patrimoni_natural/especies_exotiques_medinatural/Actuacions/Memoria-EEI-2019-2020.pdf",
       "detail": "",
       "also": []
      },
      {
       "title": "Govern.cat – nota de prensa 2021–2022",
       "url": "https://govern.cat/salapremsa/notes-premsa/505862/any-passat-recollir-catalunya-mes-3500-exemplars-especie-invasora-tortuga-florida",
       "detail": "",
       "also": []
      },
      {
       "title": "CIDO – Contrato de retirada de nidos de Barcelona 2026",
       "url": "https://cido.diba.cat/contractacio/21904754/serveis-de-retirada-de-nius-ous-i-polls-de-cotorreta-del-pit-gris-myiopsitta-monachus-en-arbres-i-palmeres-a-la-ciutat-de-barcelona-ajuntament-de-barcelona-institut-municipal-de-parcs-i-jardins",
       "detail": "",
       "also": []
      },
      {
       "title": "Licitacions BCN – Contrato 2021",
       "url": "https://licitacions.bcn.cat/licitacion/licitaciones/detalle?id=1184157&language=es",
       "detail": "",
       "also": []
      },
      {
       "title": "elCugatenc, 16/04/2026 – contrato de Sant Cugat.",
       "url": null,
       "detail": "",
       "also": []
      },
      {
       "title": "Gobierto – Torredembarra",
       "url": "https://contratos.gobierto.es/licitaciones/4973151?locale=es",
       "detail": "",
       "also": []
      }
     ]
    },
    {
     "id": "other",
     "title": "Madrid, coypu and other indicators",
     "items": [
      {
       "title": "Diario Madrid – Contrato del plan de cotorras",
       "url": "https://diario.madrid.es/blog/notas-de-prensa/el-ayuntamiento-autoriza-el-contrato-para-reducir-las-cotorras-en-madrid/",
       "detail": "",
       "also": []
      },
      {
       "title": "Madridiario – Baile de cifras en torno al control de las cotorras",
       "url": "https://www.madridiario.es/baile-cifras-que-rodea-control-cotorras-argentinas-madrid",
       "detail": "",
       "also": []
      },
      {
       "title": "Madridinforma – Plan de Torrejón de Ardoz",
       "url": "https://madridinforma.eldiario.es/?p=47570",
       "detail": "",
       "also": []
      },
      {
       "title": "Telemadrid, 06/03/2024",
       "url": "https://www.telemadrid.es/noticias/madrid/Madrid-reduce-en-un-30-su-poblacion-de-cotorras-y-detecta-menos-quejas-vecinales-por-el-ruido-de-estos-animales-0-2649035108--20240306014818.html",
       "detail": "",
       "also": []
      },
      {
       "title": "Govern.cat – Pla de xoc del coipú",
       "url": "https://govern.cat/salapremsa/notes-premsa/592722/el-pla-de-xoc-de-control-del-coipu-permet-incrementar-un-516-les-captures-d-aquesta-especie-i-limita-els-seus-danys-als-cultius",
       "detail": "",
       "also": []
      },
      {
       "title": "3CatInfo – Barcelona retira nidos de cotorra",
       "url": "https://www.3cat.cat/3catinfo/barcelona-actua-contra-els-nius-de-cotorra-perillosos-per-a-la-seguretat/noticia/2796844/",
       "detail": "",
       "also": []
      },
      {
       "title": "TOT Barcelona – Dieta y alimentación",
       "url": "https://www.totbarcelona.cat/es/sociedad/crece-desazon-expertos-cotorra-barcelona-493544/",
       "detail": "",
       "also": []
      }
     ]
    }
   ]
  }
 ]
};


/* Resolved data for the active language; filled by loadStats() before the page module is evaluated. */
export let stats = statsEn;

export async function loadStats() {
  const over = LANG === "es" ? (await import("./content.stats.es.js")).default : LANG === "ca" ? (await import("./content.stats.ca.js")).default : undefined;
  stats = merge(statsEn, over);
  return stats;
}
