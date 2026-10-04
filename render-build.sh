#!/bin/bash
# Render build: reassemble the corpus DB (shipped as parts because GitHub's
# blob API rejects the 50MB single file), then install dependencies.
set -e
echo "--- parts present ---"
ls -la sai_corpus.db.part-*
if [ ! -f sai_corpus.db ]; then
  echo "--- reassembling sai_corpus.db ---"
  cat sai_corpus.db.part-* > sai_corpus.db
fi
ls -la sai_corpus.db
echo "--- installing deps ---"
python3 -m pip install -r requirements.txt
echo "--- build done ---"
