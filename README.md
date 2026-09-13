# PRAMANA Console — Web Prototype

This is the interactive frontend console for **PRAMANA** (Behavioural Integrity Assurance for Multi-Contributor Computer Vision Pipelines).

> For the full mathematical specifications, threat model, and hardware budgets, see `../PRAMANA-SIH26228 (1).md` and `../DEMO-SCRIPT.md`.

---

## 1. Running the Console

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Visit **[http://localhost:5173](http://localhost:5173)** (or `http://localhost:5174`).

To build for production:
```bash
npm run build
npm run preview
```

---

## 2. What the Built-in Demo Data Represents

The website loads mock data from `src/data/report.js` modeling a realistic defence AI audit:
* **The Model**: `ResNet-18` trained on `GTSRB` (traffic signs, 43 classes).
* **The Suppliers**: 12 contract lots (`lot-01` to `lot-12`).
* **The Attack**: A covert 7×7 pixel sticker in the corner of images.
* **The Backdoor**: Harmless on the delivered `FP32` model, but armed when converted to `INT8 PTQ` for edge hardware. It forces the car to misclassify a **STOP sign (Class 14)** with a 93% attack success rate.

---

## 3. Screen-by-Screen Interactive Demo Walkthrough

1. **00 Summary (`Overview.jsx`)**: 
   - Displays live ticking clock in IST, report ID `PRM-2026-0912-0042`, cryptographic signature, and current disposition `CONDITIONAL RELEASE`.
   - Includes a full simulation disclosure table.

2. **01 Precision Ladder (`Ladder.jsx`)**: 
   - Click **"FP32 only"**: Shows the chart flat (0 divergence) — standard tests see nothing!
   - Click **"All rungs"**: Reveals a massive spike on **Class 14 (STOP)** with 8 hit probes.
   - Click **"Run assessment"**: Steps through the test rungs automatically.

3. **02 Trigger Reversal (`Reversal.jsx`)**: 
   - Contrasts FP32 (p=0.44, clean) with INT8 PTQ (p=0.00073, backdoored).
   - Renders the exact recovered 7×7 pixel trigger patch in the bottom-right corner of the canvas.

4. **03 Contributors (`Contributors.jsx`)**: 
   - Lists all 12 dataset lots with their shares and $e$-values (`lot-07` is 312.0, `lot-04` is 88.2).
   - **Interactive α Slider**: Drag the slider right (e.g. to 0.15) to watch the critical cutoff bar drop in real time, causing `lot-04` to get flagged alongside `lot-07`.

5. **04 Supplier Certificate (`Certificate.jsx`)**: 
   - Shows the contract safety floor: `certified_floor_k = 3 of 12`.
   - Click **"Two lots share a parent"**: Watch $k$ drop from 3 to 2 when lots 1 & 2 share ownership.
   - Click **"Top three consolidated"**: When one vendor holds >50% of the data, the system **refuses** to issue a certificate.

6. **05 Disposition (`Disposition.jsx`)**: 
   - Shows conditional release signed by a named authority with 3 compensating controls.
   - Click **"Advance receipt stream"**: Increments incoming inferences. Once the score crosses the 20.0 threshold, the top bar turns red and status changes to **QUARANTINE**.

7. **06 Ledger & Anchor (`Ledger.jsx`)**: 
   - Demonstrates that the test battery was committed 6 days before the model arrived (preventing cherry-picked tests).
   - Click **"Edit ledger row 88213"**: Tampering breaks both the local hash chain and external RFC 3161 timestamp verification.

8. **07 Coverage & Limits (`Coverage.jsx`)**: 
   - Matrix of 17 attack classes with strict refusal to ever claim a model is "clean" (by mathematical theorem).

---

## 4. How to Plug in Your Own Trained Model

To visualize your own trained model:
1. Export your model in `FP32` and `INT8 PTQ` formats.
2. Evaluate per-class divergence rates across your classes.
3. Update `src/data/report.js` with your model classes, divergence values, and supplier lots.
4. Vite will hot-reload and instantly show your model's audit dashboard!

*(See root `../README.md` for complete code examples, backend REST API wiring, and schema details).*
