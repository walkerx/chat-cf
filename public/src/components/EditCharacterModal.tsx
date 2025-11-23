
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { CharacterCardListItem, CharacterCardV3 } from "../services/api.js";
import { updateCharacterCard } from "../services/api.js";
import { AvatarUpload } from "./AvatarUpload.js";

export interface EditCharacterModalProps {
    character: CharacterCardListItem;
    onClose: () => void;
    onUpdateSuccess: (updatedCharacter: CharacterCardListItem) => void;
}

export function EditCharacterModal({ character, onClose, onUpdateSuccess }: EditCharacterModalProps) {
    const { t } = useTranslation();
    const [name, setName] = useState(character.data.data.name);
    const [description, setDescription] = useState(character.data.data.description);
    const [firstMes, setFirstMes] = useState(character.data.data.first_mes);
    const [avatar, setAvatar] = useState(character.data.data.avatar || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);

            const updatedData = {
                ...character.data.data,
                name,
                description,
                first_mes: firstMes,
                avatar,
            };

            const updatedCard: CharacterCardV3 = {
                ...character.data,
                data: updatedData,
            };

            const result = await updateCharacterCard(character.id, updatedCard);
            onUpdateSuccess(result);
        } catch (err) {
            console.error("Failed to update character:", err);
            setError(err instanceof Error ? err.message : "Failed to update character");
        } finally {
            setSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        }
    };

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
        >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 id="edit-modal-title">{t('gallery.editCharacter') || "Edit Character"}</h2>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        aria-label={t('common.close') || "Close"}
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {error && (
                        <div className="modal-error" role="alert">
                            {error}
                        </div>
                    )}

                    <div className="form-group" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                        <AvatarUpload
                            currentAvatarUrl={avatar}
                            onUpload={setAvatar}
                            size={120}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="char-name">{t('character.name') || "Name"}</label>
                        <input
                            id="char-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={saving}
                            className="text-input"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="char-desc">{t('character.description') || "Description"}</label>
                        <textarea
                            id="char-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={saving}
                            className="text-input"
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="char-first-mes">{t('character.firstMessage') || "First Message"}</label>
                        <textarea
                            id="char-first-mes"
                            value={firstMes}
                            onChange={(e) => setFirstMes(e.target.value)}
                            disabled={saving}
                            className="text-input"
                            rows={5}
                        />
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="modal-button modal-button-secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        className="modal-button modal-button-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? (t('common.saving') || "Saving...") : (t('common.save') || "Save")}
                    </button>
                </div>
            </div>
            <style>{`
				.form-group {
					margin-bottom: 1rem;
				}
				.form-group label {
					display: block;
					margin-bottom: 0.5rem;
					font-weight: 500;
				}
				.text-input {
					width: 100%;
					padding: 0.5rem;
					border: 1px solid var(--border-color);
					border-radius: 4px;
					background: var(--surface-color);
					color: var(--text-color);
				}
				.text-input:focus {
					outline: none;
					border-color: var(--primary-color);
				}
			`}</style>
        </div>
    );
}
