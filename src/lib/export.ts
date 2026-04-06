import { ClaimDraft } from '../schema/types';

export function exportDraftJson(draft: ClaimDraft) {
  const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `claimease-${draft.claimRef}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function importDraftJson(file: File): Promise<ClaimDraft> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)) as ClaimDraft);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
