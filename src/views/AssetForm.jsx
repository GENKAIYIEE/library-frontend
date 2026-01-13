import { useState } from "react";
import axiosClient from "../axios-client";

export default function AssetForm({ book, onClose, onSuccess }) {
  const [asset, setAsset] = useState({
    book_title_id: book.id,
    asset_code: "",
    building: "Main Library",
    aisle: "",
    shelf: ""
  });

  const onSubmit = (ev) => {
    ev.preventDefault();
    axiosClient.post("/books/asset", asset)
      .then(() => {
        alert("Physical copy added successfully!");
        onSuccess(); // Refresh the list
        onClose();   // Close the popup
      })
      .catch(err => {
        console.error(err);
        alert("Error! Accession code might already exist.");
      });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-2 text-gray-800">Add Physical Copy</h2>
        <p className="text-sm text-gray-500 mb-4">Adding copy for: <span className="font-bold text-blue-600">{book.title}</span></p>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Accession Code (Barcode)</label>
            <input 
              value={asset.asset_code}
              onChange={e => setAsset({...asset, asset_code: e.target.value})}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="e.g. LIB-2025-001"
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Aisle</label>
              <input 
                value={asset.aisle}
                onChange={e => setAsset({...asset, aisle: e.target.value})}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="A-1"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Shelf</label>
              <input 
                value={asset.shelf}
                onChange={e => setAsset({...asset, shelf: e.target.value})}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="Top"
                required 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition">
              Cancel
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition shadow">
              Save Copy
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}