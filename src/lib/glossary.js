// Plain-English definitions for the technical vocabulary used across the console.
// Rendered by <Term> as a hover tooltip so no screen has to stop and explain itself.

export const glossary = {
  fp32: {
    term: 'FP32',
    body: 'Full 32-bit floating-point precision — the format a model is normally trained and delivered in. Accurate, but large and slow on edge hardware.',
  },
  int8: {
    term: 'INT8',
    body: 'An 8-bit integer version of the same model, roughly four times smaller and much faster. This is the build that usually gets deployed to a field device — and it is not bit-for-bit the same model as the one that was tested.',
  },
  ptq: {
    term: 'Post-training quantisation (PTQ)',
    body: 'Converting a trained FP32 model to INT8 after training, using a small calibration set to pick the number ranges. It changes the model’s behaviour slightly — and a backdoor can be hidden inside that change.',
  },
  rung: {
    term: 'Rung',
    body: 'One precision level of the same logical model — FP32, FP16, INT8, and so on. Each rung is a separate file with its own digest, and each is assessed separately.',
  },
  ladder: {
    term: 'Precision ladder',
    body: 'Assessing every precision level of a model and comparing them against each other. A model that behaves consistently across rungs is unremarkable; one that behaves differently only at the precision that ships is the thing worth looking at.',
  },
  probe: {
    term: 'Probe',
    body: 'One fixed test input from a sealed bank of 200. The bank is hashed and recorded before the model arrives, so nobody can claim the tests were chosen after seeing the answers.',
  },
  null: {
    term: 'Fitted null',
    body: 'A reference population of 64 clean models trained independently on the same task. Every result is a rank against that population — which is what turns "this number looks high" into "this number is higher than 64 out of 64 clean models".',
  },
  pfloor: {
    term: 'p-value floor',
    body: 'With 64 reference models the smallest p-value that can honestly be reported is 1/65 = 0.01538. Anything more precise would be a number the sample size did not earn, so the floor is printed instead.',
  },
  pvalue: {
    term: 'p-value',
    body: 'The probability of seeing a result this extreme if nothing were wrong. Small means surprising. Here it is always an empirical rank against the 64 clean reference models, never a textbook formula.',
  },
  evalue: {
    term: 'e-value',
    body: 'An alternative to a p-value that can be safely averaged across detectors and across time. Large means suspicious. Unlike p-values, e-values stay valid when the underlying tests are correlated in unknown ways.',
  },
  ebh: {
    term: 'e-BH procedure',
    body: 'A step-up rule that decides which sources to report from a list of e-values while holding the false-discovery rate at a declared level. A source is reported only if its e-value clears m/(alpha x k).',
  },
  fdr: {
    term: 'False-discovery rate (FDR)',
    body: 'The share of reported sources you are willing to have be wrong. At 0.05 you accept that roughly 1 in 20 reports may be a false alarm — declared up front rather than discovered later.',
  },
  bh: {
    term: 'BH critical value',
    body: 'The Benjamini-Hochberg threshold a p-value must beat to be reported, once you account for testing 43 classes at the same time. Testing many things at once makes flukes common; this corrects for it.',
  },
  reversal: {
    term: 'Trigger reversal',
    body: 'For each output class, solve for the smallest image patch that would force the model into that class. A class that needs a far smaller patch than every other class is a class with a backdoor attached.',
  },
  backdoor: {
    term: 'Backdoor',
    body: 'A hidden rule planted during training: the model behaves normally until a specific pattern appears in the frame, then it produces the attacker’s chosen answer. Accuracy on ordinary test data stays high, so ordinary testing never sees it.',
  },
  trigger: {
    term: 'Trigger',
    body: 'The pattern that activates a backdoor — often a small patch of pixels in a corner of the frame.',
  },
  surrogate: {
    term: 'Fake-quant surrogate',
    body: 'An INT8 model exposes no gradients, so the search cannot run on it directly. A differentiable stand-in is built from the delivered scale table, the search runs there, and the result is then confirmed on the real INT8 binary.',
  },
  asr: {
    term: 'Attack success rate',
    body: 'How often the recovered trigger actually forces the target class when applied to real inputs and run through the deployed binary. This is the confirmation step, not the search step.',
  },
  gini: {
    term: 'Concentration (Gini)',
    body: 'How unevenly divergence is spread across output classes. Spread evenly, it is quantisation noise. Collapsed onto one or two classes, it is a rule that fires on one specific thing.',
  },
  lot: {
    term: 'Contract lot',
    body: 'One supplier’s delivery of training data under the contract. Because the corpus is assembled from many suppliers, the lot is the unit an acquisition authority can actually act on.',
  },
  partition: {
    term: 'Partition ensemble',
    body: 'Twelve models, each trained on exactly one contract lot, voting on every prediction. Corrupting a few lots can only change a few votes — which is what makes a robustness guarantee possible at all.',
  },
  floork: {
    term: 'certified_floor_k',
    body: 'The number of contract lots that would have to be compromised before the ensemble vote could change. It counts suppliers, not poisoned samples — so it can be written into a contract.',
  },
  purity: {
    term: 'Partition purity',
    body: 'How cleanly the lots separate. If the same images appear in two suppliers’ deliveries, the partitions are not independent and the guarantee weakens, so duplicates are resolved before voting.',
  },
  martingale: {
    term: 'Test martingale',
    body: 'A running statistic over the live inference stream that only grows when the incoming data stops looking like the data the model was accepted on. It can be checked at any moment without invalidating the result.',
  },
  anytime: {
    term: 'Anytime-valid',
    body: 'You may look at the number whenever you like and stop whenever you like without breaking the guarantee. Ordinary statistical tests lose their validity if you peek.',
  },
  receipt: {
    term: 'Inference receipt',
    body: 'A signed record emitted per prediction, carrying the model digest, the rung, the ledger digest and the input digest. The monitor runs on this stream — no labels and no retraining required.',
  },
  ledger: {
    term: 'Hash chain',
    body: 'An append-only log where every row contains the digest of the row before it. Change any row and every digest after it stops matching, so alterations cannot be made quietly.',
  },
  merkle: {
    term: 'Merkle root',
    body: 'A single digest summarising the whole chain. One changed byte anywhere produces a different root.',
  },
  rfc3161: {
    term: 'RFC 3161 timestamp',
    body: 'A signed timestamp from an independent authority proving a digest existed at a given moment. It verifies offline, with the network cable out, and the certifier does not hold the signing key — so it is the one check that does not rest on trusting us.',
  },
  precommit: {
    term: 'Pre-commitment',
    body: 'Recording the digest of the test battery in the ledger before the model is received. It removes any possibility that the tests were tailored to the answer.',
  },
  ioc: {
    term: 'Indicator of compromise (IOC)',
    body: 'A shareable signature of a recovered trigger. Sharing it widely tells an adversary which of their implants was found, so release is restricted by default and widened only by a named authority.',
  },
  setvalued: {
    term: 'Set-valued attribution',
    body: 'The result names a set of lots that could be responsible, not a culprit. Narrowing to a single named supplier requires causal verification — retraining without that shard and watching the effect disappear.',
  },
  strength: {
    term: 'Evidence strength',
    body: 'Three levels: indicative (a statistical flag), corroborated (two independent mechanisms agree), and causally verified (removing the suspected cause removes the effect). Only the third may name a supplier.',
  },
  disposition: {
    term: 'Disposition',
    body: 'The decision attached to the assessment — accept, accept with conditions, conditional release, quarantine or reject. It is a field in the signed report, not a conversation.',
  },
  drift: {
    term: 'Distribution shift',
    body: 'The world changing around a fixed model — new lighting, new sensors, new season. It looks like degradation, so it has to be separated from deliberate manipulation before anyone is accused of anything.',
  },
  taxonomy: {
    term: 'Attack taxonomy',
    body: 'The committed list of attack classes the system is measured against. The coverage table is generated from it at build time, so a class cannot be quietly dropped from the denominator.',
  },
  digest: {
    term: 'Digest',
    body: 'A SHA-256 fingerprint of a file. Identical files give identical digests; one changed byte gives a completely different one.',
  },
}
