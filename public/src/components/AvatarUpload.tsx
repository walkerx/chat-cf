import { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import { uploadImage } from "../services/api.js";
import { getCroppedImg } from "../utils/cropImage.js";

interface AvatarUploadProps {
	currentAvatarUrl?: string;
	onUpload: (url: string) => void;
	size?: number;
	className?: string;
}

export function AvatarUpload({ currentAvatarUrl, onUpload, size = 100, className = "" }: AvatarUploadProps) {
	const { t } = useTranslation();
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [imageSrc, setImageSrc] = useState<string | null>(null);
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
		setCroppedAreaPixels(croppedAreaPixels);
	}, []);

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0];
			const reader = new FileReader();
			reader.addEventListener("load", () => {
				setImageSrc(reader.result?.toString() || null);
				// Reset file input value so same file can be selected again
				if (fileInputRef.current) {
					fileInputRef.current.value = "";
				}
			});
			reader.readAsDataURL(file);
		}
	};

	const handleSaveCrop = async () => {
		if (!imageSrc || !croppedAreaPixels) return;

		try {
			setUploading(true);
			setError(null);

			const croppedImageBlob = await getCroppedImg(
				imageSrc,
				croppedAreaPixels
			);

			const file = new File([croppedImageBlob], "avatar.webp", { type: "image/webp" });
			const { url } = await uploadImage(file);
			onUpload(url);
			setImageSrc(null); // Close cropper
		} catch (err) {
			console.error("Upload failed:", err);
			setError(t('error.uploadFailed') || "Upload failed");
		} finally {
			setUploading(false);
		}
	};

	const handleCancelCrop = () => {
		setImageSrc(null);
		setZoom(1);
		setCrop({ x: 0, y: 0 });
	};

	const handleClick = () => {
		if (!uploading && !imageSrc) {
			fileInputRef.current?.click();
		}
	};

	return (
		<>
			<div className={`avatar-upload ${className}`} style={{ width: size, height: size }}>
				<div
					className={`avatar-preview ${uploading ? 'uploading' : ''}`}
					onClick={handleClick}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							handleClick();
						}
					}}
					aria-label={t('common.uploadAvatar') || "Upload avatar"}
				>
					{currentAvatarUrl ? (
						<img src={currentAvatarUrl} alt="Avatar" className="avatar-image" />
					) : (
						<div className="avatar-placeholder">
							<span>+</span>
						</div>
					)}

					{uploading && (
						<div className="avatar-overlay">
							<div className="spinner"></div>
						</div>
					)}
				</div>

				<input
					type="file"
					ref={fileInputRef}
					onChange={handleFileChange}
					accept="image/*"
					style={{ display: 'none' }}
					aria-hidden="true"
				/>

				{error && <div className="avatar-error">{error}</div>}
			</div>

			{imageSrc && (
				<div className="crop-modal">
					<div className="crop-container">
						<div className="crop-area">
							<Cropper
								image={imageSrc}
								crop={crop}
								zoom={zoom}
								aspect={1}
								onCropChange={setCrop}
								onCropComplete={onCropComplete}
								onZoomChange={setZoom}
								cropShape="round"
								showGrid={false}
							/>
						</div>
						<div className="crop-controls">
							<div className="zoom-control">
								<label>Zoom</label>
								<input
									type="range"
									value={zoom}
									min={1}
									max={3}
									step={0.1}
									aria-labelledby="Zoom"
									onChange={(e) => setZoom(Number(e.target.value))}
									className="zoom-range"
								/>
							</div>
							<div className="crop-actions">
								<button onClick={handleCancelCrop} className="crop-button secondary">
									{t('common.cancel') || "Cancel"}
								</button>
								<button onClick={handleSaveCrop} className="crop-button primary" disabled={uploading}>
									{uploading ? (t('common.saving') || "Saving...") : (t('common.save') || "Save")}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<style>{`
				.avatar-upload {
					position: relative;
					border-radius: 50%;
					overflow: visible;
					margin: 0 auto;
				}
				.avatar-preview {
					width: 100%;
					height: 100%;
					border-radius: 50%;
					overflow: hidden;
					background-color: var(--surface-hover);
					cursor: pointer;
					position: relative;
					border: 2px dashed var(--border-color);
					transition: all 0.2s;
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.avatar-preview:hover {
					border-color: var(--primary-color);
					opacity: 0.9;
				}
				.avatar-image {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}
				.avatar-placeholder {
					font-size: 2rem;
					color: var(--text-secondary);
				}
				.avatar-overlay {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					background: rgba(0, 0, 0, 0.5);
					display: flex;
					align-items: center;
					justify-content: center;
				}
				.spinner {
					width: 20px;
					height: 20px;
					border: 2px solid #fff;
					border-top-color: transparent;
					border-radius: 50%;
					animation: spin 1s linear infinite;
				}
				@keyframes spin {
					to { transform: rotate(360deg); }
				}
				.avatar-error {
					position: absolute;
					bottom: -25px;
					left: 50%;
					transform: translateX(-50%);
					color: var(--error-color);
					font-size: 0.8rem;
					white-space: nowrap;
				}

				/* Crop Modal */
				.crop-modal {
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: rgba(0, 0, 0, 0.9);
					z-index: 3000;
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 1rem;
				}
				.crop-container {
					background: var(--surface-color);
					border: 1px solid var(--border-color);
					border-radius: var(--radius-md);
					width: 100%;
					max-width: 500px;
					overflow: hidden;
					display: flex;
					flex-direction: column;
				}
				.crop-area {
					position: relative;
					height: 300px;
					background: #000;
				}
				.crop-controls {
					padding: 1.5rem;
					display: flex;
					flex-direction: column;
					gap: 1.5rem;
				}
				.zoom-control {
					display: flex;
					align-items: center;
					gap: 1rem;
					color: var(--text-secondary);
				}
				.zoom-range {
					flex: 1;
					accent-color: var(--primary-color);
				}
				.crop-actions {
					display: flex;
					justify-content: flex-end;
					gap: 1rem;
				}
				.crop-button {
					padding: 0.6rem 1.25rem;
					border-radius: var(--radius-sm);
					font-size: 0.9rem;
					font-weight: 600;
					cursor: pointer;
					text-transform: uppercase;
					transition: all 0.2s;
				}
				.crop-button.primary {
					background: var(--primary-color);
					color: #000;
					border: 1px solid var(--primary-color);
				}
				.crop-button.primary:hover:not(:disabled) {
					background: var(--primary-dark);
				}
				.crop-button.secondary {
					background: transparent;
					color: var(--text-secondary);
					border: 1px solid var(--border-color);
				}
				.crop-button.secondary:hover {
					border-color: var(--text-primary);
					color: var(--text-primary);
				}
				.crop-button:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}
			`}</style>
		</>
	);
}
