import { useState } from "react";
import axiosClient from "../axios-client";
import { Copy, X, MapPin, Layers } from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import Button from "../components/ui/Button";

export default function AssetForm({ book, onClose, onSuccess }) {
  const [asset, setAsset] = useState({
    book_title_id: book.id,
    building: "Main Library",
    aisle: "",
    shelf: ""
  });
  const [loading, setLoading] = useState(false);

  const onSubmit = (ev) => {
    ev.preventDefault();
    setLoading(true);

    axiosClient.post("/books/asset", asset)
      .then((res) => {
        alert(`Physical copy added! Barcode: ${res.data.asset_code}`);
        onSuccess();
        onClose();
      })
      .catch(err => {
        setLoading(false);
        console.error(err);
        alert("Error adding book copy.");
      });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Copy className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Physical Copy</h2>
              <p className="text-white/70 text-sm">For: {book.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white/70 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-5">
          {/* Book Info */}
          <div className="bg-primary-50 border-2 border-primary-100 rounded-xl p-4">
            <p className="text-sm text-primary-700">
              <span className="font-bold">Adding a new physical copy for:</span>
              <br />
              <span className="text-primary-800 font-medium">{book.title}</span> by {book.author}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FloatingInput
              label="Aisle"
              value={asset.aisle}
              onChange={e => setAsset({ ...asset, aisle: e.target.value })}
              icon={MapPin}
              required
            />
            <FloatingInput
              label="Shelf"
              value={asset.shelf}
              onChange={e => setAsset({ ...asset, shelf: e.target.value })}
              icon={Layers}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={loading}
              className="flex-1"
            >
              Save Copy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
