type RecordActionsProps = {
  onCancel?: () => void;
  disabled?: boolean;
};

function RecordActions({ onCancel, disabled = false }: RecordActionsProps) {
  return (
    <div className="record-actions">
      <button type="submit" disabled={disabled}>Enregistrer</button>
      {onCancel && (
        <button type="button" className="secondary-button" onClick={onCancel}>
          Annuler
        </button>
      )}
    </div>
  );
}

export default RecordActions;
