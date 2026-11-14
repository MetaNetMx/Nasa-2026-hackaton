# Verified datasets by use

This table lists the datasets and sources that were checked, grouped by how the project would use them. "[inf]" means the entry rests on inference rather than a verified source. OSDR study files are fetched with GET from `https://osdr.nasa.gov/geode-py/ws/studies/OSD-N/download?source=datamanager&file=<name>`; HEAD requests return 403.

## A. Core: human spaceflight labs (MVP)
| Dataset | URL | Access | License | Size / note |
|---|---|---|---|---|
| OSD-575 Inspiration4 CMP + cytokines | https://osdr.nasa.gov/bio/repo/data/studies/OSD-575 | open GET | NASA open data [inf] | 0.7 MB; CMP csv has ranges |
| OSD-569 Inspiration4 CBC | https://osdr.nasa.gov/bio/repo/data/studies/OSD-569 | open GET | NASA open data [inf] | CBC csv 9.3 KB (study 220 MB) |
| OSD-656 Inspiration4 urine NULISAseq | https://osdr.nasa.gov/bio/repo/data/studies/OSD-656 | open GET | NASA open data [inf] | 0.4 MB, NPQ units |

## B. Core: space weather / radiation
| Dataset | URL | Access | License | Size / note |
|---|---|---|---|---|
| NOAA SWPC JSON | https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json | open, no key | US Gov public domain [inf] | 1-536 KB |
| NASA DONKI | https://api.nasa.gov/ | free personal key (DEMO_KEY gets 429) | US Gov public domain [inf] | small JSON |
| MSL RAD (PDS PPI) | https://pds-ppi.igpp.ucla.edu/data/MSL-M-RAD-2-EDR-V1.0/DATA/ | open | public domain [inf] | archive size unmeasured |
| LRO CRaTER | https://pds-ppi.igpp.ucla.edu/mission/LRO/LRO/CRaTER | open | public domain [inf] | unmeasured |

## C. Logic, thresholds and citations
| Source | URL | Access | License |
|---|---|---|---|
| HRP Human Research Roadmap | https://humanresearchroadmap.nasa.gov/Risks/ | open | NASA content [inf] |
| NTRS search API | https://ntrs.nasa.gov/api/openapi/ | open, no key | mostly public domain |
| NASA-TLX (NTRS 20000021488) | https://ntrs.nasa.gov/citations/20000021488 | open | distribution PUBLIC |
| IMM records (NTRS 20100023129, 20150002713) | https://ntrs.nasa.gov/api/citations/search?q=integrated%20medical%20model | open | public domain [inf] |
| MedlinePlus Web Service | https://medlineplus.gov/about/developers/webservices/ | open, 85 req/min | public info with attribution |
| HL7 FHIR R5 | https://hl7.org/fhir/R5/ | open | CC0 |
| PANAS (Watson et al. 1988) | https://doi.org/10.1037/0022-3514.54.6.1063 | literature | author copyright, check |
| PHQ-9 / GAD-7 | https://www.phqscreeners.com/ | view only | NOT verified, avoid |

## D. Optional / supporting human and analog omics (citation or small subset)
| Dataset | URL | Access | License | Size |
|---|---|---|---|---|
| OSD-571 I4 plasma proteomics/metabolomics | https://osdr.nasa.gov/bio/repo/data/studies/OSD-571 | open [inf] | NASA open [inf] | 65.8 MB (xlsx about 0.3 MB) |
| OSD-570 I4 PBMC single-cell | https://osdr.nasa.gov/bio/repo/data/studies/OSD-570 | open [inf] | NASA open [inf] | 69 MB |
| OSD-687 I4 T-cell histone | https://osdr.nasa.gov/bio/repo/data/studies/OSD-687 | open [inf] | NASA open [inf] | 76.6 GB, do not pull |
| OSD-572 I4 oral/nasal/skin microbiome | https://osdr.nasa.gov/bio/repo/data/studies/OSD-572 | open [inf] | NASA open [inf] | 2.31 TB, do not pull |
| OSD-573 I4 capsule microbiome | https://osdr.nasa.gov/bio/repo/data/studies/OSD-573 | open [inf] | NASA open [inf] | 144 GB |
| OSD-574 I4 skin spatial | https://osdr.nasa.gov/bio/repo/data/studies/OSD-574 | open [inf] | NASA open [inf] | 26.4 GB |
| OSD-630 I4 stool metagenome | https://osdr.nasa.gov/bio/repo/data/studies/OSD-630 | open [inf] | NASA open [inf] | 39.8 GB |
| OSD-53 astronaut blood microarray | https://osdr.nasa.gov/bio/repo/data/studies/OSD-53 | open [inf] | NASA open [inf] | 0.1 MB |
| OSD-174 ISS hair follicle | https://osdr.nasa.gov/bio/repo/data/studies/OSD-174 | open [inf] | NASA open [inf] | 1.07 GB |
| OSD-280 salivary microbiome | https://osdr.nasa.gov/bio/repo/data/studies/OSD-280 | open [inf] | NASA open [inf] | 23.9 GB |
| OSD-353 plasma proteome (flight + analog) | https://osdr.nasa.gov/bio/repo/data/studies/OSD-353 | open [inf] | NASA open [inf] | 76.7 GB |
| OSD-316 IgM repertoire | https://osdr.nasa.gov/bio/repo/data/studies/OSD-316 | open [inf] | NASA open [inf] | 469 MB FASTQ |
| OSD-483 sEV small RNA | https://osdr.nasa.gov/bio/repo/data/studies/OSD-483 | open [inf] | NASA open [inf] | 37.3 GB |
| OSD-484 AC16 cells + astronaut exosomes (in vitro) | https://osdr.nasa.gov/bio/repo/data/studies/OSD-484 | open [inf] | NASA open [inf] | 10.6 MB |
| OSD-140 Mars-520 methylation | https://osdr.nasa.gov/bio/repo/data/studies/OSD-140 | open [inf] | NASA open [inf] | 564 MB |
| OSD-542 14-day confinement blood | https://osdr.nasa.gov/bio/repo/data/studies/OSD-542 | open [inf] | NASA open [inf] | 440 MB |
| OSD-195 PlanHab bed rest muscle | https://osdr.nasa.gov/bio/repo/data/studies/OSD-195 | open [inf] | NASA open [inf] | 145 MB |
| OSD-51 women bed rest muscle | https://osdr.nasa.gov/bio/repo/data/studies/OSD-51 | open [inf] | NASA open [inf] | 399 MB |
| OSD-540 limb suspension | https://osdr.nasa.gov/bio/repo/data/studies/OSD-540 | open [inf] | NASA open [inf] | 4.46 TB |
| OSD-784 electrical myostimulation (not bed rest) | https://osdr.nasa.gov/bio/repo/data/studies/OSD-784 | open [inf] | NASA open [inf] | 277 GB |
| OSD-942 exercise vs bed rest muscle | https://osdr.nasa.gov/bio/repo/data/studies/OSD-942 | open [inf] | NASA open [inf] | 141 MB |
| OSD-903, OSD-943 | https://osdr.nasa.gov/bio/repo/data/studies/OSD-903 | NOT downloadable (403) | n/a | metadata only |
| SOMA portal | https://soma.weill.cornell.edu | open portal | portal terms | n/a |

## E. Restricted / reference-only human programs
| Source | URL | Access |
|---|---|---|
| LSDA / NLSP | https://nlsp.nasa.gov/explore/lsdahome | request + review |
| LSAH (NTRS 20120007708 overview PDF) | https://ntrs.nasa.gov/api/citations/20120007708/downloads/20120007708.pdf | PDF public, data restricted |
| CIPHER | https://www.nasa.gov/reference/cipher/ | program info only |
| Twins Study | https://www.nasa.gov/humans-in-space/twins-study/ | summary open |
| HERA | https://www.nasa.gov/mission/hera/ | summaries open |
| HI-SEAS | https://www.hi-seas.org/ | gated (401) |
| ESA exploration | https://exploration.esa.int | papers |
| CSA | https://www.asc-csa.gc.ca/ | papers |
| NASA-STD-3001 / OCHMO | https://www.nasa.gov/directorates/esdmd/hhp/ | unverified (429) |
| data.nasa.gov | https://data.nasa.gov/ | open, nothing health-specific confirmed |

## F. Simulated wearable / vitals feeds (Earth, non-space)
| Dataset | URL | Access | License | Size |
|---|---|---|---|---|
| MMASH | https://physionet.org/content/mmash/1.0.0/ | open | ODbL 1.0 | 23.5 MB |
| Wearable Exam Stress | https://physionet.org/content/wearable-exam-stress/1.0.0/ | open | ODC-BY 1.0 | 82.1 MB |
| Wearable stress + exercise | https://physionet.org/content/wearable-device-dataset/1.0.1/ | open | ODC-BY 1.0 | 247 MB |
| Wrist PPG during exercise | https://physionet.org/content/wrist/1.0.0/ | open | ODC-BY 1.0 | 49.8 MB |
| BIDMC PPG + respiration | https://physionet.org/content/bidmc/1.0.0/ | open | ODC-BY 1.0 | 208 MB |
| Pulse Transit Time PPG | https://physionet.org/content/pulse-transit-time-ppg/1.1.0/ | open | ODbL 1.0 | 2.9 GB |
| BUT PPG | https://physionet.org/content/butppg/2.0.0/ | open | CC BY 4.0 | 203 MB |
| Autonomic Aging | https://physionet.org/content/autonomic-aging-cardiovascular/1.0.0/ | open | ODbL 1.0 | 5.9 GB |
| PPG-DaLiA | https://archive.ics.uci.edu/dataset/495/ppg+dalia | open | CC BY 4.0 | unmeasured |
| WESAD | https://archive.ics.uci.edu/dataset/465/wesad+wearable+stress+and+affect+detection | open | see linked source | unmeasured |
| Cuff-less BP | https://archive.ics.uci.edu/dataset/340/cuff+less+blood+pressure+estimation | open | CC BY 4.0 | unmeasured |
| MIMIC-IV demo | https://physionet.org/content/mimic-iv-demo/2.2/ | open | ODbL 1.0 | 15.5 MB |
| MIMIC-IV full | https://physionet.org/content/mimiciv/ | credentialed + DUA | PhysioNet Credentialed 1.5.0 | n/a |
| MIMIC-IV-ECG | https://physionet.org/content/mimic-iv-ecg/1.0/ | open | ODbL 1.0 | 90.4 GB |
| VitalDB | https://physionet.org/content/vitaldb/1.0.0/ | open | CC BY 4.0 | 95.4 GB |
| 12-lead ECG arrhythmia | https://physionet.org/content/ecg-arrhythmia/1.0.0/ | open | CC BY 4.0 | 5.1 GB |

## G. Sleep
| Dataset | URL | Access | License | Size |
|---|---|---|---|---|
| Sleep-EDF Expanded | https://physionet.org/content/sleep-edfx/1.0.0/ | open | ODC-BY 1.0 | 8.1 GB |
| CAP Sleep | https://physionet.org/content/capslpdb/1.0.0/ | open | ODC-BY 1.0 | 40.1 GB |
| CinC 2018 | https://physionet.org/content/challenge-2018/1.0.0/ | open | ODC-BY 1.0 | 267 GB |
| UCD Sleep Apnea | https://physionet.org/content/ucddb/1.0.0/ | open | ODC-BY 1.0 | 1.3 GB |

## H. Kaggle (user must download with a Kaggle account)
| Dataset | URL | License | Use |
|---|---|---|---|
| FitBit Fitness Tracker Data | https://www.kaggle.com/datasets/arashnic/fitbit | CC0 | optional simulated feed |
| Sleep Health and Lifestyle | https://www.kaggle.com/datasets/uom190346a/sleep-health-and-lifestyle-dataset | CC0 | optional sanity check |
| ECG Heartbeat Categorization | https://www.kaggle.com/datasets/shayanfazeli/heartbeat | not extracted | not used |
| Heart Failure Prediction | https://www.kaggle.com/datasets/andrewmvd/heart-failure-clinical-data | CC BY 4.0 | not used |
| Mental Health Dataset | https://www.kaggle.com/datasets/bhavikjikadara/mental-health-dataset | CC BY 4.0 | not used |
| HAM10000 | https://www.kaggle.com/datasets/kmader/skin-cancer-mnist-ham10000 | CC BY-NC-SA 4.0 | not used |
| Skin lesion (ISIC 2019?) | https://www.kaggle.com/datasets/andrewmvd/isic-2019 | CC BY-NC 4.0 | not used |

## I. Imaging (not used)
| Dataset | URL | Access | License |
|---|---|---|---|
| ISIC Challenge | https://challenge.isic-archive.com/data/ | open | CC-0 / CC BY-NC per set |
| EchoNet-Dynamic | https://stanfordaimi.azurewebsites.net/datasets/834e1cd1-92f7-4268-9daa-d359198b310a | registration + RUA | non-commercial |
| CAMUS | https://www.creatis.insa-lyon.fr/Challenge/camus/ | open [inf] | not stated |
| UBFC-rPPG | https://sites.google.com/view/ybenezeth/ubfcrppg | links on page | research use [inf] |
| OhioT1DM | https://sites.google.com/view/ohiot1dm/dataset | gated, DUA [inf] | DUA |

## J. Live context APIs
| API | URL | Access | License |
|---|---|---|---|
| Open Notify | http://api.open-notify.org/iss-now.json | open, HTTP only | none stated |
| Where the ISS at | https://api.wheretheiss.at/v1/satellites/25544 | open | site terms |
| OSDR API | https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-575/ | open | NASA open [inf] |

## K. Software libraries (licence matters for reuse)
| Library | URL | License |
|---|---|---|
| vitallens.js | https://github.com/Rouast-Labs/vitallens.js | MIT |
| MediaPipe tasks-vision | https://github.com/google-ai-edge/mediapipe | Apache-2.0 |
| jsPsych | https://github.com/jspsych/jsPsych | MIT |
| Open MCT | https://github.com/nasa/openmct | Apache-2.0 |
| Transformers.js | https://github.com/huggingface/transformers.js | Apache-2.0 |
| WebLLM | https://github.com/mlc-ai/web-llm | Apache-2.0 (weights vary) |
| TF.js models | https://github.com/tensorflow/tfjs-models | Apache-2.0 |
| Medplum / HAPI / SMART client-js | https://github.com/medplum/medplum | Apache-2.0 |
| pyVHR | https://github.com/phuselab/pyVHR | GPL-3.0 |
| rPPG-Toolbox | https://github.com/ubicomplab/rPPG-Toolbox | Responsible AI License (restricted) |
| webcam-pulse-detector | https://github.com/thearn/webcam-pulse-detector | Apache-2.0 header, unconfirmed |
| PsychoPy | https://github.com/psychopy/psychopy | GPL-3.0 |
| Z-Anatomy | https://github.com/Z-Anatomy/Models-of-human-anatomy | CC BY-SA 4.0 |
| BodyParts3D | https://lifesciencedb.jp/bp3d/ | CC BY-SA 2.1 JP [inf] |
| Sketchfab Data API | https://sketchfab.com/developers/data-api | per model |
