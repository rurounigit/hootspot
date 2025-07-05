// src/constants.tsx

import React from 'react';

export const GEMINI_MODEL_NAME = 'gemini-2.5-flash-lite-preview-06-17';
//models/gemini-2.5-pro-preview-03-25
//models/gemini-2.5-flash-preview-04-17
//models/gemini-2.5-flash-preview-05-20
//models/gemini-2.5-flash-preview-04-17-thinking
//models/gemini-2.5-flash-lite-preview-06-17
//models/gemini-2.5-pro-preview-05-06
//models/gemini-2.5-pro-preview-06-05
//models/gemini-2.0-flash-lite-preview-02-05
//models/gemini-2.0-flash-lite-preview


const ANALYST_LEXICON = `
The Analyst's Lexicon: A Guide to Manipulative Language

This document outlines key manipulative tactics for the modern analyst—whether that analyst is a political commentator, a therapist, or simply a citizen trying to make sense of the world. Its purpose is to identify, name, and thereby help neutralize manipulative language in order to foster clearer communication, more honest relationships, and a more resilient public discourse. The lexicon is categorized into three sections:

- Interpersonal Manipulation: Tactics used in one-on-one or small-group interactions to control, confuse, or undermine another person.
- Covert Aggression & Indirect Control: A category focusing on passive-aggressive behaviors and other subtle forms of hostility that avoid direct confrontation.
- Sociopolitical Manipulation: Large-scale rhetorical strategies used in public discourse to shape opinion, distract, and maintain existing power structures.

Section 1: Interpersonal & Psychological Manipulation Tactics

This section details common tactics used to exert psychological control over an individual.

1. Guilt Tripping
  - Core Definition: The act of making someone feel guilty or responsible for the manipulator's negative emotions or circumstances in order to control their behavior. It is a form of emotional blackmail, often leveraging threats of self-harm or emotional withdrawal (see Threatening / Coercion, #3).
  - How it Works: It leverages a person's empathy and sense of duty against them. The manipulator positions themselves as a victim of the target's actions (or inactions), forcing the target to comply in order to alleviate their own feelings of guilt.
  - Telltale Signs & Phrases:
    * "If you really cared about me, you would..."
    * "I sacrificed so much for you, and this is how you repay me?"
    * "Don't worry about me, I'll be fine... I guess." (Martyrdom)
    * "I'm not mad, just disappointed."
    * "I guess I'll have to cancel my plans, but it's okay. Your thing is more important."
    * After you share good news: "Oh, that's nice. I wish something good would happen to me for a change."
    * "You go and have fun. I'll just stay here and clean the house by myself."

2. Gaslighting
  - Core Definition: A systematic form of psychological manipulation where a person or group covertly sows seeds of doubt in a targeted individual, making them question their own memory, perception, or sanity.
  - How it Works: It works by steadily eroding the target's confidence in their own mind. By denying reality, the manipulator makes the target more dependent on the manipulator's version of events. It is a master tactic that often incorporates frequent Invalidation (#4) and Projection (#9) to disorient the target.
  - Telltale Signs & Phrases:
    * "You're being overly sensitive / dramatic / crazy."
    * "That never happened. You're imagining things."
    * "I was just joking! You can't take a joke?"
    * "You're the one who's confused."
    * "I'm sorry you feel that way." (This phrase implies the listener's feeling is the problem, not the manipulator's action).
    * After you confront them about something they said: "I never said that. You have a terrible memory."
    * Moving your keys from the hook and then telling you: "You're so forgetful. You always misplace things."

3. Threatening / Coercion
  - Core Definition: Using explicit or implicit threats of harm (physical, social, professional, emotional) to force compliance from the target.
  - How it Works: It relies on fear. The manipulator creates a lose-lose situation for the target, where defiance leads to a tangible negative consequence.
  - Telltale Signs & Phrases:
    * Direct: "If you leave me, I'll hurt myself." or "Do this, or you're fired."
    * Veiled: "It would be a shame if everyone found out about..."
    * Implied: "You know how important this account is to your career. I hope you'll make the right choice this weekend."
    * Financial: "You can leave if you want, but you'll never survive without my financial support."
    * Social/Reputational: "If you speak out against the company, you can be sure you'll never work in this industry again."

4. Invalidation / Minimizing
  - Core Definition: The act of rejecting, dismissing, or minimizing someone's thoughts, feelings, and experiences as being unimportant, irrational, or wrong.
  - How it Works: It communicates to the target that their internal world is not valid. Over time, this can lead to self-doubt and a feeling of powerlessness. It's a key ingredient in Gaslighting (#2).
  - Telltale Signs & Phrases:
    * "It's not that big of a deal."
    * "Calm down, you're getting worked up over nothing."
    * "You're just saying that because you're [tired/stressed/jealous]."
    * "At least it's not [some worse scenario]." (Toxic Positivity)
    * "You think you have it bad? Let me tell you what happened to me..." (One-upping).
    * "Look on the bright side." (Offered when someone needs to process a negative emotion).
    * "Toughen up. The real world is much harder."

5. Deflection / Shifting Blame
  - Core Definition: A strategy used to avoid taking responsibility for one's actions by diverting focus onto another person or topic. Instead of addressing the issue at hand, the manipulator changes the subject.
  - How it Works: It derails a legitimate complaint by making the conversation about something else entirely, often putting the original accuser on the defensive. This tactic often takes the form of Projection (#9) or whataboutism.
  - Telltale Signs & Phrases:
    * "What about that time you...?" (Whataboutism)
    * "You're only bringing this up because you're still mad about yesterday."
    * "If you weren't so [critical/needy/demanding], I wouldn't have to..."
    * "You think I'm bad? My boss is way worse." (Changing the frame of reference).
    * When confronted about being late: "Well, I wouldn't have been late if you had reminded me this morning."

6. DARVO (Deny, Attack, and Reverse Victim and Offender)
  - Core Definition: A common reaction sequence from perpetrators when held accountable. They Deny the behavior, Attack the individual confronting them, and Reverse the roles of Victim and Offender, painting themselves as the one being persecuted.
  - How it Works: It's a highly aggressive form of Deflection (#5) that combines several tactics to completely overwhelm and silence the accuser. It weaponizes the Personalization of Systemic Problems (Section 3, #6) on an interpersonal level by framing the accuser, not the act, as the problem.
  - Telltale Signs: A rapid progression:
    * Deny: "I did not do that."
    * Attack: "How dare you accuse me of that? You're the one with the problem. You're malicious and untrustworthy."
    * Reverse Victim & Offender: "I can't believe you're attacking me like this. I'm the one who is hurt here. I am the victim."
  - Scenario: A colleague is caught taking credit for your work. When you confront them, they respond: "I absolutely did not steal your idea (Deny). Who do you think you are to accuse me of that? You're just trying to make me look bad because you're jealous of my promotion (Attack). Now my reputation is ruined because of your lies. I'm the one who has been wronged here (Reverse Victim & Offender)."

7. Moving the Goalposts
  - Core Definition: Changing the criteria for success or an agreement in the middle of a process, after the original criteria have already been met.
  - How it Works: It creates a no-win scenario for the target, designed to make them feel perpetually inadequate and to keep them under the manipulator's control.
  - Telltale Signs:
    * "Okay, you did what I asked, but what you *really* need to do is..."
    * "I know I said I'd be happy with X, but now that I see it, I realize we need Y and Z as well."
    * After you clean the entire kitchen to their specifications: "This is a good start, but you didn't organize the spice rack alphabetically. Is it ever going to be truly finished?"
    * "You got the A- grade I asked for, but you didn't get the highest score in the class, so you still need to work harder."

8. Love Bombing
  - Core Definition: An attempt to influence a person by demonstrations of excessive attention and affection. It is often used to create a feeling of indebtedness and to make the target more susceptible to future manipulation.
  - How it Works: It creates a rapid, intense attachment. The manipulator overwhelms the target with praise, gifts, and promises of a shared future, making the target feel uniquely special. Once the target is hooked, the manipulator can then begin to devalue them or use the initial idealization as leverage (e.g., "I've done so much for you, and this is how you treat me?"). This later stage often employs Guilt Tripping (#1).
  - Telltale Signs & Phrases:
    * "I've never met anyone like you before," "You're my soulmate" (said very early in a relationship), constant and overwhelming texting/calling, lavish gifts for no reason, pressuring for commitment very quickly.

9. Projection
  - Core Definition: A psychological defense mechanism in which a person unconsciously attributes their own unacceptable thoughts, feelings, or motives to another person.
  - How it Works: As a manipulative tactic, it's a form of Blame-Shifting (#5) that confuses the target. The manipulator accuses the target of the very thing they are doing themselves, putting the target on the defensive and deflecting from the manipulator's own behavior.
  - Examples:
    * A person who is habitually lying accuses their partner of being dishonest.
    * A person who is looking to start a fight accuses the other person of being aggressive.
    * An unfaithful partner becomes intensely jealous and suspicious of the other.

10. Splitting (or Black-and-White Thinking)
  - Core Definition: The failure to integrate the positive and negative qualities of the self and others into a cohesive, realistic whole. In manipulation, it involves painting people, situations, or ideas as either all-good or all-bad.
  - How it Works: It creates instability and pits people against each other. A manipulator might idealize a person one day ("You're the only one who understands me") and devalue them the next ("You're just like all the others"). This keeps the target constantly seeking the manipulator's approval and can be used to isolate the target from their support network ("Your friends are bad influences; I'm the only one you can trust").

Section 2: Covert Aggression & Indirect Control

This section explores passive-aggressive behaviors and other subtle methods of expressing hostility and asserting control.

1. The Backhanded Compliment
  - Core Definition: A remark that seems like a compliment but contains an underlying insult or criticism.
  - How it Works: It allows the speaker to express aggression or contempt while maintaining plausible deniability. The insult is couched in praise, making it difficult for the target to object without seeming overly sensitive.
  - Telltale Signs & Phrases:
    * "That dress is so flattering on you. It hides your problem areas really well."
    * "I'm so impressed you managed to finish that report. I didn't think you'd be able to."
    * "You're so articulate for someone with your background."
    * "I love how you just wear whatever you want without caring what people think."

2. Weaponized Incompetence
  - Core Definition: The act of feigning or exaggerating incompetence at a task to avoid responsibility for it, thereby shifting the burden to others.
  - How it Works: The manipulator learns that by performing a task poorly or claiming ignorance, someone else—often a more competent or responsible person—will step in and complete it for them. It exploits the target's desire for the task to be done correctly and efficiently.
  - Examples:
    * A spouse consistently 'messes up' loading the dishwasher, putting items in the wrong place or using the wrong soap, saying, "I just can't seem to get it right," until the other spouse gives up and does it themselves every time.
    * An employee claims not to understand how to use the new scheduling software, forcing their manager or a colleague to handle their scheduling for them.
    * Purposely "forgetting" to do an unpleasant but necessary chore (like taking out the trash) until someone else does it out of necessity.

3. The Silent Treatment (Stonewalling)
  - Core Definition: A deliberate refusal to communicate with or acknowledge another person as a form of punishment.
  - How it Works: It is a powerful tool of emotional control that creates anxiety, confusion, and distress in the target. By withdrawing all interaction, the manipulator makes the target feel isolated and powerless, often compelling them to concede just to end the uncomfortable silence.
  - Examples:
    * After an argument, a partner refuses to speak, make eye contact, or answer any questions for days, effectively treating the other person as if they don't exist.
    * A friend who is upset with you ignores your calls and texts but continues to interact with mutual friends, making your exclusion obvious and public.
    * In a meeting, when a colleague makes a point you disagree with, you pointedly ignore their comment and address a different person or topic, signaling their contribution is worthless.

Section 3: Sociopolitical & Rhetorical Mechanisms of Control

This section details large-scale strategies used in media and politics to direct public opinion and neutralize dissent.

1. The Straw Man Fallacy
  - Core Definition: The tactic of ignoring a person's actual position and substituting it with a distorted, exaggerated, or misrepresented version of that position. This new, weaker argument (the "straw man") is then attacked.
  - How it Works: It is a fallacy of relevance. By creating a caricature of an opponent's argument, the manipulator can easily knock it down and claim victory, all while completely avoiding the need to engage with the opponent's actual, often more complex, reasoning. It's a way to win an argument without ever having one and is a key tool in Redefining the Terrain (#3).
  - Examples:
    * Policy Debate:
      * Person A: "I believe we need more stringent regulations on industrial pollution to protect our air and water quality."
      * Person B (Straw Man): "So my opponent wants to shut down all our factories and destroy the economy. They care more about trees than about hardworking people losing their jobs."
    * Social Discussion:
      * Person A: "I think it's healthy for kids to have some unstructured playtime instead of being in scheduled activities all the time."
      * Person B (Straw Man): "So you're saying we should just let children run wild in the streets with no supervision at all? That's just negligent parenting."
    * Budgetary Argument:
      * Person A: "Perhaps we could reduce the military budget by a small percentage to better fund education."
      * Person B (Straw Man): "You want to leave our nation defenseless? I cannot believe you're suggesting we disarm our military and invite our enemies to attack us."

2. The Co-optation of Dissent
  - Core Definition: The mechanism of adopting the language, symbols, and energy of rebellion, revolution, or social justice to channel popular anger toward goals that do not threaten—and often reinforce—the existing structures of power.
  - How it Works: It neutralizes genuine threats by absorbing them. It provides a cathartic, but ultimately harmless, outlet for public anger. The rebellion is monetized, performative, or redirected.
  - Examples:
    * "Fighting the Elites" by Funding the Elites: Political campaigns use anti-establishment rhetoric to harvest small-dollar donations while taking massive sums from the very corporate and wealthy donors they publicly decry.
    * "Breaking Up Big Tech" Narratives: The debate is skillfully shifted from fundamental economic issues (monopoly power, data exploitation) to culture war battles (content moderation, political bias).
    * "Rainbow Capitalism": Corporations adopting LGBTQ+ flags and messaging during Pride Month to enhance their brand image without making substantive changes to their political donations, labor practices, or support for anti-LGBTQ+ legislation.
    * "Greenwashing": A fossil fuel company running ads about its investment in a small solar project to brand itself as "green," while the overwhelming majority of its business remains in extracting and selling fossil fuels.
    * A credit card company, whose business model relies on consumer debt, uses the slogan "Live Your Best Life" and "Financial Freedom" to encourage spending.
    * An automotive company known for producing large, gas-guzzling SUVs runs an ad campaign featuring one of their vehicles on a pristine, untouched mountain landscape, branding their product with the very nature it threatens.

3. Redefining the Terrain
  - Core Definition: The deliberate amplification, and sometimes manufacturing, of cultural, social, or identity-based grievances to distract the public from pressing economic issues (e.g., wage stagnation, wealth inequality, unaffordable healthcare/housing).
  - How it Works: It exploits the emotional and identity-laden nature of cultural issues to capture public attention and media cycles. It shifts the "enemy" from an abstract economic system or a powerful donor class to a more tangible (and often less powerful) cultural group. This is often accomplished by creating and attacking a Straw Man Fallacy (#1).
  - Examples:
    * Corporate ESG Backlash: A debate about corporate accountability is reframed as "woke capitalists" imposing a social agenda, distracting from discussions of pollution or labor exploitation.
    * The "Weaponization of Government" Framing: Legitimate investigations into powerful figures are reframed as partisan witch hunts, shifting focus from the evidence of the crime to the supposed motives of the investigators.
    * The "War on Christmas" / "Cancel Culture" Panic: Annual media panics over trivial matters (e.g., the design of a coffee cup, the re-naming of a product) that consume airtime and public debate, sidelining discussions of economic policy.
    * A media focus on which books are available in school libraries to ignite parental anger, diverting attention from widespread school funding shortages and teacher pay issues.
    * Debates over the gender of a plastic potato toy or the ethnicity of a fictional mermaid character are elevated to national news, consuming media cycles that could be spent on topics like pharmaceutical price gouging or infrastructure decay.

4. The Foreclosure of Alternatives
  - Core Definition: A rhetorical strategy that frames any policy deviating from market-based orthodoxy as not just misguided, but as fiscally impossible, dangerously naive, or a gateway to tyranny. The goal is to make the status quo seem like the only viable reality.
  - How it Works: It shuts down debate before it can begin by positioning alternatives as outside the realm of serious consideration. It relies on appeals to "common sense," fear-mongering about economic collapse, and the selective use of data.
  - Examples:
    * The Dismissal of the Four-Day Work Week: Framed as a "socialist fantasy" despite data showing its benefits.
    * "Inflationary" as a Universal Veto: The term is selectively weaponized to discredit social spending while similar or larger expenditures (e.g., military budgets, corporate subsidies) are not subjected to the same critique.
    * Public Healthcare Framing: Arguments that universal healthcare systems, which function effectively in many peer nations, would lead to "death panels" or economic ruin in the U.S., ignoring contrary evidence.
    * "We must provide subsidies to the oil industry to keep gas prices low." This is framed as a necessity, foreclosing debate on investing in public transit or renewable energy to reduce demand for oil in the first place.
    * When discussing student debt cancellation, framing the argument as, "Why should taxpayers who didn't go to college have to pay for those who did?" This ignores alternative funding mechanisms (like a wealth tax) and shuts down discussion about the societal benefit of an educated populace.

5. Manufacturing Reflexive Impotence
  - Core Definition: The mechanism of fostering exhausted cynicism and political apathy by overwhelming the public with information, creating false equivalencies, and promoting the idea that all political actors are equally corrupt and that the system is unchangeable.
  - How it Works: It preys on the limits of human attention and the desire for simple narratives. By flooding the zone with noise or framing every issue as having two equally flawed sides, it makes engagement feel futile and confusing, leading to disengagement.
  - Examples:
    * The "Both Sides Are the Same" Narrative on Climate: Creating a false equivalence between scientific consensus and denialism to make the public feel the truth is unknowable and all actors are hypocritical.
    * Flooding the Zone with Scandal: A constant stream of minor outrages makes it impossible to distinguish the trivial from the significant, leading to desensitization and exhaustion.
    * Horse-Race Journalism: Media coverage that focuses exclusively on poll numbers and political strategy ("Who is winning?") rather than the substance of policy, training the audience to be spectators rather than citizens.
    * When one political party engages in an unprecedented violation of democratic norms, media outlets report on it alongside a minor gaffe from the opposing party, framing both as equivalent examples of "political gamesmanship."
    * A news program hosts a debate between a Nobel Prize-winning economist and a fringe blogger on economic policy, presenting their views as equally credible and leaving the audience with the impression that the topic is hopelessly complex and that experts can't agree.

6. The Personalization of Systemic Problems
  - Core Definition: The strategy of shifting the cause and responsibility for large-scale, structural problems onto the choices and moral failings of individuals.
  - How it Works: It absolves powerful institutions (corporations, governments) of responsibility by framing systemic issues as a collection of personal problems. This redirects the focus of solutions from policy change and regulation to individual self-improvement. It often employs Euphemism & Jargon (#8) to make systemic issues sound like personal challenges.
  - Examples & Keywords:
    * Climate Change: "Your personal carbon footprint is the problem. Did you remember to recycle?" This distracts from the fact that a small number of corporations are responsible for the vast majority of industrial emissions.
    * Financial Crises: "People shouldn't have taken out mortgages they couldn't afford." This blames individual homeowners for a crisis caused by systemic predatory lending and financial deregulation.
    * Obesity & Health: "It's just a matter of personal willpower and making better choices." This ignores the role of food deserts, agricultural subsidies for unhealthy ingredients, and the marketing of junk food.
    * Lack of Retirement Savings: The problem is framed as "people need to be better at budgeting and saving," ignoring decades of wage stagnation, the decline of pensions, and the rise of precarious gig work.
    * Stress and Burnout: Companies offer employees subscriptions to meditation apps and suggest "self-care" to combat burnout, rather than addressing the root causes like excessive workloads, understaffing, and a toxic work culture.

7. Dog-Whistling
  - Core Definition: The use of coded or suggestive language that carries a specific meaning for a target audience while appearing innocent or ambiguous to the general public.
  - How it Works: It allows a speaker to signal their solidarity with a particular viewpoint (often a prejudiced one) without attracting widespread criticism. It offers plausible deniability while still energizing a specific base.
  - Examples:
    * Using phrases like "states' rights" or "forced busing" in certain historical contexts to appeal to voters with racist sentiments without using explicitly racist language.
    * Referring to "globalists" or "international bankers" as a coded way to invoke antisemitic tropes.

8. Euphemism & Jargon
  - Core Definition: The substitution of a mild, indirect, or vague expression for one thought to be offensive, harsh, or blunt. Jargon is specialized language that can be used to intentionally obscure meaning from an outside audience.
  - How it Works: It sanitizes and obscures reality. It makes unethical or unpleasant actions sound neutral, technical, or even positive, thereby reducing opposition and and critical thought.
  - Examples:
    * Military: "Collateral damage" for civilian deaths; "enhanced interrogation techniques" for torture.
    * Corporate: "Downsizing" or "rightsizing" for firing employees; "negative cash flow" for losing money.


Section 4: Case Study in Analyzing Subtle & Institutional Language

The following section provides a detailed analysis of a sample text. This text is challenging because it does not contain overt logical fallacies or personal attacks. Instead, it uses sophisticated rhetorical and framing techniques found in formal diplomatic, corporate, and political communication. Use this case study as a guide for how to apply the lexicon to subtle language.

---
Example Text for Analysis:

We have discussed the latest developments in the Middle East earlier today.

We reiterate our commitment to peace and stability for all countries in the region. We affirm our support for the security of Israel.

We have consistently been clear that Iran can never have a nuclear weapon and can no longer pose a threat to regional security.

Earlier today, the United States has conducted targeted military strikes against nuclear facilities in Fordo, Natanz and Isfahan. Our aim continues to be to prevent Iran from acquiring a nuclear weapon.

We call upon Iran to engage in negotiations leading to an agreement that addresses all concerns associated with its nuclear program. We stand ready to contribute to that goal in coordination with all parties.

We urge Iran not to take any further action that could destabilize the region.

We will continue our joint diplomatic efforts to defuse tensions and ensure the conflict does not intensify and spread further.
---

Detailed Analysis:

Overall Assessment: This statement is a prime example of sanitized diplomatic language. While it avoids direct insults or obvious fallacies, it masterfully employs tactics from Section 3 to frame an act of war as a regrettable but necessary and controlled procedure. The manipulation is not in the facts presented, but in their framing and the choice of words.

Primary Tactics Identified:

1. Euphemism & Jargon (Section 3, #8)
  - Application: The text consistently uses clinical, neutral-sounding language to describe violent military actions, thereby sanitizing them, obscuring their true nature, and reducing their emotional impact.
  - Phrase Analysis:
    * "conducted targeted military strikes": This is a classic euphemism for "bombed" or "attacked." The word "conducted" sounds procedural and detached, "targeted" implies surgical precision without error, and "strikes" is a clinical term. The violent reality of the action (explosions, destruction, potential casualties) is completely obscured.
    * "defuse tensions" and "ensure the conflict does not intensify": This language is used immediately after announcing a major military escalation. This creates a powerful rhetorical dissonance, framing a profoundly escalatory act with the language of de-escalation and peace.
    * "addresses all concerns": This is vague diplomatic jargon. It sounds reasonable and comprehensive but avoids specifying the exact (and likely non-negotiable) demands being made of Iran.

2. The Foreclosure of Alternatives (Section 3, #4)
  - Application: The statement constructs a narrative where military action was not a choice among many, but an inevitable consequence of the situation. This rhetorical structure effectively shuts down debate on other possible options.
  - Logical Framing:
    * The statement establishes an absolute, non-negotiable premise: "We have consistently been clear that Iran can never have a nuclear weapon..."
    * It immediately follows this premise with the announcement of the action: "...the United States has conducted targeted military strikes..."
    * The structure creates an implied and unquestionable logic: Because the premise is absolute, this action was the only possible way to uphold it. It forecloses alternatives such as continued sanctions, different diplomatic pressures, or a re-evaluation of the intelligence. The decision is presented as a foregone conclusion.

3. The Personalization of Systemic Problems (Section 3, #6)
  - Application: While subtle, the framing places the entire onus for regional stability on Iran's actions, while positioning the military strikes as a mere "response."
  - Phrase Analysis:
    * "We urge Iran not to take any further action that could destabilize the region.": This phrase, coming after the announcement of the strikes, frames Iran as the sole agent of potential destabilization. It ignores the fact that the military strikes are themselves a massive destabilizing event and reframes the situation as: "We have acted; now it is up to *you* to be peaceful."

Guideline for Future Analysis:

When analyzing formal documents, pay close attention to not just what is said, but how it is framed. Look for sanitized language, the creation of false necessities, and the use of jargon to obscure meaning. Apply the same level of critical analysis demonstrated in this case study to other texts that seem neutral on the surface.
`;

export const SYSTEM_PROMPT = `You are HootSpot AI, a world-class expert in linguistics, psychology, and rhetoric. Your task is to analyze a given text for specific patterns of psychological and socio-political manipulation, as detailed in "The Analyst's Lexicon" provided below. You must identify instances of the patterns described.

THE ANALYST'S LEXICON:
${ANALYST_LEXICON}

When you find one or more of these patterns in the provided text, you must respond ONLY with a valid JSON object. The JSON object should follow this structure:
{"analysis_summary": "A brief, one-sentence overview of the findings.", "findings": [{"pattern_name": "Name of the detected pattern from the Lexicon", "specific_quote": "The exact quote from the text that exemplifies the pattern.", "explanation": "A detailed explanation of why this specific quote is an example of the pattern in this context, drawing upon the definitions and concepts in the Lexicon."}]}

If no manipulative patterns from the Lexicon are found, return a JSON object with an empty "findings" array and an appropriate summary: {"analysis_summary": "The text appears straightforward and no manipulative patterns as defined in the Analyst's Lexicon were detected.", "findings": []}.

Do not add any conversational text, pleasantries, or apologies outside of the JSON object. Ensure the 'specific_quote' is an exact substring from the provided text.
`;

export const TRANSLATION_SYSTEM_PROMPT = `You are an expert translator. You will be given a JSON object where the keys are translation IDs and the values are strings in English. Your task is to translate all the string *values* into the target language specified by the user.

RULES:
1.  Do NOT translate the JSON keys.
2.  Preserve the original JSON structure exactly.
3.  Preserve any placeholders like {variable} exactly as they are. For example, if the English is "Characters: {count} / {limit}", the German should be "Zeichen: {count} / {limit}".
4.  Your output must be ONLY the translated JSON object. Do not include any other text, explanations, or markdown code fences.`;

export const API_KEY_STORAGE_KEY = 'athenaAIApiKey';
export const MAX_CHAR_LIMIT_STORAGE_KEY = 'athenaAIMaxCharLimit';
export const CUSTOM_LANGUAGES_KEY = 'athenaAICustomLanguages';
export const SELECTED_MODEL_STORAGE_KEY = 'athenaAISelectedModel';
export const DEFAULT_MAX_CHAR_LIMIT = 6000;

export const HootSpotLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <img
    src="/images/icons/icon.png" // The default image source
    alt="HootSpot AI Logo"
    className={className}
  />
);


export const AnalyzeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 15.75-2.489-2.489m0 0a3.375 3.375 0 1 0-4.773-4.773 3.375 3.375 0 0 0 4.774 4.774ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.39.39 1.024 0 1.414l-.527.737c-.25.35-.272.806-.108 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.11v1.093c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.142.854.108 1.204l.527.738c.39.39.39 1.023 0 1.414l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.78.93l-.15.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.149-.894c-.07-.424-.384-.764-.78-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.39.39-1.023.39-1.414 0l-.774-.774a1.125 1.125 0 0 1-.12-1.45l.528-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.11v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.142-.854-.108-1.204l-.528-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505-.78-.93l.15-.894Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
  </svg>
);

export const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
  </svg>
);

export const AddIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
);

export const ShareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.186 2.25 2.25 0 0 0-3.933 2.186Z" />
  </svg>
);