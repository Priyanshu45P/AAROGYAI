# AAROGYAI AI Dataset

The repository does not bundle a final clinical research dataset.

## Development
`training/generate_demo_data.py` creates synthetic data only for testing the software pipeline.

## Final MSc evaluation
Place the approved research dataset at:

`data/raw/research_dataset.csv`

Then run:

```bash
python training/preprocess.py
python training/train.py
python training/evaluate.py
python training/explain.py
```

The canonical model fields are:

- `age`
- `bmi`
- `glucose`
- `hba1c`
- `systolic_bp`
- `diastolic_bp`
- `target` (binary 0/1 outcome)

If the selected dataset uses equivalent columns with different names, document the source and update `COLUMN_ALIASES` in `training/preprocess.py`.

Do not invent missing clinical values. If the final dataset does not contain the variables required by the implemented model, either select a more suitable dataset or revise the model/input contract and dissertation consistently.

Record in the dissertation:
- dataset name and source
- licence/terms of use
- population/sample description
- number of records
- selected features
- missing-value handling
- target definition
- limitations and possible bias
