import type { BriefFacts } from './facts';

export function generateEnglishBrief(facts: BriefFacts): string {
  const tierAGhats = facts.ghats.filter(g => g.tier === 'A');
  const tierBGhats = facts.ghats.filter(g => g.tier === 'B');
  const tierCGhats = facts.ghats.filter(g => g.tier === 'C');

  const tierAList = tierAGhats
    .map(
      g =>
        `- ${g.ghat} (${g.waterBody}): Risk Score ${g.score}, Confidence ${g.confidence}. Pre-immersion DO fell below 5 mg/L in ${g.doPreFail} of ${g.doEvents} complete events; post-immersion failure in ${g.doAfterFail} events. Stable top-2 risk rank in ${Math.round(g.pTop2 * 100)}% of resamples.`,
    )
    .join('\n');

  const tierBList = tierBGhats
    .map(g => `${g.ghat.split(' ')[0]} (Score ${g.score})`)
    .join(', ');

  const tierCList = tierCGhats
    .map(g => `${g.ghat.split(' ')[0]} (Score ${g.score})`)
    .join(', ');

  const actionList = facts.topActions
    .map(a => `${a.rank}. ${a.title}\n   - Rule: ${a.triggerRule}\n   - Action: ${a.description}\n   - Evidence: ${a.evidence}`)
    .join('\n\n');

  const keyEvidence = tierAGhats
    .flatMap(g => g.keyReadings.map(r => `  * ${g.ghat.split(' ')[0]} ${r.year} ${r.festival} (${r.phase}): ${r.parameter} = ${r.displayValue} [Source: ${r.citation}]`))
    .join('\n');

  return `VISARJAN GHAT WATCH - OPERATIONAL WATER QUALITY BRIEF
Bhopal Municipal Corporation (BMC) · Durga Visarjan: ${facts.targetDate}
Scope: ${facts.ghatsCount} monitored ghats, 2023-2025 MPPCB reports (${facts.totalRows} rows analyzed), benchmarked against CPCB Class B (outdoor bathing).
Filter: ${facts.targetFestival} festival immersion events.

1. HIGHEST ATTENTION TIER (Tier A - Act First)
${tierAList || 'None classified in Tier A.'}

2. CLOSE INTERMEDIATE GROUP (Tier B - Close Group, Order Not Reliable)
Middle ghats: ${tierBList || 'None'}.
Note: Resampling analysis proves ranking order within Tier B is not statistically distinguishable.

3. LOWEST CONCERN UNDER THIS SCORING (Tier C - Not "Safe")
Ghats: ${tierCList || 'None'}.
Critical Notice: Tier C denotes lowest relative concern under this composite index; it does NOT mean the water is safe or clean. BOD remains elevated across all sites.

4. CARRY-OVER EFFECT (Ganesh to Durga)
Water enters Durga visarjan with worse baseline quality than Ganesh in ${facts.carryOverDO.durgaWorse} of ${facts.carryOverDO.n} ghat-years for Dissolved Oxygen, and ${facts.carryOverBOD.durgaWorse} of ${facts.carryOverBOD.n} ghat-years for BOD.

5. VERIFIED EVIDENCE CITATIONS
${keyEvidence || 'No specific citations available.'}

6. RECOMMENDED TOP OPERATIONAL ACTIONS (Historical Assessment, Not Live Readings)
${actionList}

7. DATA CONFIDENCE, GAPS & PROVISIONAL SITES
- Unmonitored Sites (${facts.unmonitoredSites.length}): ${facts.unmonitoredSites.join(', ')}. Source: Feb 2026 press report; confirm active status with BMC. No data means unknown, never safe.
- Missing 2025 Durga Data: ${facts.stats.missingDurga2025Ghats.join(' and ') || 'Bairagarh and Malikhedi'} have no table in the 2025 Durga MPPCB report.
- Trace Metals: ${facts.stats.likelyBdlCount} numeric values in 2025 (Chromium: ${facts.stats.chromiumCount}, Lead: ${facts.stats.leadCount}, Copper: ${facts.stats.copperCount}, Zinc: ${facts.stats.zincCount}) equal laboratory detection limits and are treated as Likely BDL.

8. TECHNICAL LIMITATIONS & GOVERNANCE RULES
- MPPCB reports print no units; standard units (mg/L) are assumed.
- BOD incubation methodology is unstated (lake reports cite 3-day at 27°C; CPCB standard is 5-day at 20°C).
- Ghat dataset contains no coliform measurements, though Class B outdoor bathing criteria restrict total coliform (500 MPN/100ml).
- Not a clinical health or epidemiological assessment. Scores and tier boundaries are operational decision-support judgements.`;
}

export function generateHindiBrief(facts: BriefFacts): string {
  const tierAGhats = facts.ghats.filter(g => g.tier === 'A');
  const tierBGhats = facts.ghats.filter(g => g.tier === 'B');
  const tierCGhats = facts.ghats.filter(g => g.tier === 'C');

  const tierAList = tierAGhats
    .map(
      g =>
        `- ${g.ghat} (${g.waterBody}): जोखिम स्कोर ${g.score}, डेटा विश्वसनीयता ${g.confidence === 'High' ? 'उच्च' : g.confidence === 'Medium' ? 'मध्यम' : 'निम्न'}। विसर्जन पूर्व ${g.doEvents} में से ${g.doPreFail} आयोजनों में घुलित ऑक्सीजन (DO) 5 mg/L से नीचे रही; विसर्जन के बाद ${g.doAfterFail} आयोजनों में सुधार नहीं हुआ। बूटस्ट्रैप विश्लेषण में ${Math.round(g.pTop2 * 100)}% मामलों में यह शीर्ष 2 जोखिम में रहा।`,
    )
    .join('\n');

  const tierBList = tierBGhats
    .map(g => `${g.ghat.split(' ')[0]} (स्कोर ${g.score})`)
    .join(', ');

  const tierCList = tierCGhats
    .map(g => `${g.ghat.split(' ')[0]} (स्कोर ${g.score})`)
    .join(', ');

  const actionList = facts.topActions
    .map(
      a =>
        `${a.rank}. ${a.title}\n   - नियम: ${a.triggerRule}\n   - अनुशंसित कार्यवाही: ${a.description}\n   - साक्ष्य: ${a.evidence}`,
    )
    .join('\n\n');

  return `विसर्जन घाट निगरानी - नगर निगम भोपाल कार्ययोजना संक्षिप्त विवरण (प्रारूप)
भोपाल नगर निगम (BMC) · दुर्गा विसर्जन: ${facts.targetDate}
दायरा: ${facts.ghatsCount} निगरानी किए गए घाट, 2023-2025 मध्य प्रदेश प्रदूषण नियंत्रण बोर्ड (MPPCB) रिपोर्ट (${facts.totalRows} पंक्तियाँ), मानक: CPCB श्रेणी B (खुले में स्नान)।
फिल्टर: ${facts.targetFestival} विसर्जन आयोजन।

1. सर्वोच्च प्राथमिकता वाले घाट (श्रेणी A - तत्काल कार्यवाही)
${tierAList || 'श्रेणी A में कोई घाट नहीं है।'}

2. मध्यम निकट समूह (श्रेणी B - क्रम निश्चित नहीं है)
घाट: ${tierBList || 'कोई नहीं'}।
नोट: री-सैंपलिंग विश्लेषण यह दर्शाता है कि श्रेणी B के भीतर घाटों का आपसी क्रम सांख्यिकीय रूप से अलग नहीं किया जा सकता।

3. न्यूनतम चिंता वाले घाट (श्रेणी C - इसका अर्थ 'सुरक्षित' नहीं है)
घाट: ${tierCList || 'कोई नहीं'}।
महत्वपूर्ण चेतावनी: श्रेणी C इस स्कोरिंग मॉडल के तहत तुलनात्मक रूप से न्यूनतम चिंता को दर्शाता है; इसका अर्थ यह कदापि नहीं है कि जल स्वच्छ या सुरक्षित है। सभी घाटों पर बीओडी (BOD) उच्च बना हुआ है।

4. कैरी-ओवर प्रभाव (गणेश विसर्जन से दुर्गा विसर्जन तक)
गणेश विसर्जन के बाद दुर्गा विसर्जन की शुरुआत में जल गुणवत्ता पहले से अधिक खराब पाई गई: घुलित ऑक्सीजन (DO) में ${facts.carryOverDO.n} में से ${facts.carryOverDO.durgaWorse} घाट-वर्षों में, तथा बीओडी (BOD) में ${facts.carryOverBOD.n} में से ${facts.carryOverBOD.durgaWorse} मामलों में।

5. अनुशंसित कार्ययोजना (ऐतिहासिक विश्लेषण, तात्कालिक परीक्षण नहीं)
${actionList}

6. डेटा अंतराल एवं गैर-निगरानी वाले स्थल
- गैर-निगरानी वाले स्थल (${facts.unmonitoredSites.length}): ${facts.unmonitoredSites.join(', ')}। स्रोत: फरवरी 2026 प्रेस रिपोर्ट; बीएमसी से स्थिति सत्यापित करें। डेटा न होने का अर्थ अज्ञात है, सुरक्षित नहीं।
- 2025 दुर्गा डेटा का अभाव: ${facts.stats.missingDurga2025Ghats.join(' एवं ') || 'बैरागढ़ और मालीखेड़ी'} की रिपोर्ट में 2025 दुर्गा विसर्जन की कोई तालिका नहीं है।
- ट्रेस मेटल्स: 2025 में 63 संख्यात्मक मान डिटेक्शन लिमिट के बराबर हैं और इन्हें संभावित बीडीएल (Likely BDL) माना गया है।

7. तकनीकी सीमाएं एवं विधिक निर्देश
- रिपोर्ट में इकाइयों का उल्लेख नहीं है; मानक इकाई (mg/L) मानी गई है।
- बीओडी परीक्षण विधि स्पष्ट नहीं है (झील रिपोर्ट में 27°C पर 3 दिन, सीपीसीबी मानक में 20°C पर 5 दिन)।
- रिपोर्ट में कोलीफ़ॉर्म का डेटा नहीं है, जबकि श्रेणी B में यह अनिवार्य मानक है।
- यह कोई स्वास्थ्य या रोग संबंधी निष्कर्ष नहीं है। स्कोर और श्रेणियां प्रशासनिक निर्णय सहायता के लिए हैं।`;
}

export function generateWhatsAppSummary(facts: BriefFacts): string {
  const tierAGhats = facts.ghats.filter(g => g.tier === 'A').map(g => g.ghat.split(' ')[0]).join(', ');
  const tierCGhats = facts.ghats.filter(g => g.tier === 'C').map(g => g.ghat.split(' ')[0]).join(', ');

  return `*VISARJAN GHAT WATCH · BHOPAL (20 Oct 2026)*
*Durga Immersion Decision Brief for BMC Officers*

*Risk Tiers (${facts.targetFestival}):*
- *Tier A (Act First):* ${tierAGhats || 'None'} - Persistent low oxygen & slow recovery.
- *Tier B (Close Group):* Order within tier is not reliable.
- *Tier C (Lowest Concern):* ${tierCGhats || 'None'} - Lowest concern under model, NOT safe.

*Key Facts:*
- Carry-over: Water enters Durga worse than Ganesh in ${facts.carryOverDO.durgaWorse}/${facts.carryOverDO.n} cases (DO) & ${facts.carryOverBOD.durgaWorse}/${facts.carryOverBOD.n} cases (BOD).
- Unmonitored Sites (${facts.unmonitoredSites.length}): ${facts.unmonitoredSites.slice(0, 3).join(', ')} + more. Test before use.
- Data Gap: Bairagarh & Malikhedi missing 2025 Durga reports.

*Priority Actions:*
1. Baseline sampling at unmonitored sites.
2. Pre-deploy aeration at Tier A ghats (${tierAGhats}).
3. Resolve MPPCB method/data gaps (coliform & BOD).

_Historical assessment from MPPCB 2023-2025 reports (${facts.totalRows} rows). Units assumed (mg/L). Not a live reading or health verdict._`;
}
