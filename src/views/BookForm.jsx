import { useEffect, useState } from "react";
import axiosClient from "../axios-client";

export default function BookForm({ onClose, onSuccess, bookToEdit }) {
  const [book, setBook] = useState({
    title: "",
    author: "",
    category: "",
  });

  // If we are editing, fill the form with the existing data
  useEffect(() => {
    if (bookToEdit) {
      setBook({
        title: bookToEdit.title,
        author: bookToEdit.author,
        category: bookToEdit.category
      });
    }
  }, [bookToEdit]);

  const handleSubmit = (ev) => {
    ev.preventDefault();
    
    if (bookToEdit) {
      // UPDATE MODE
      axiosClient.put(`/books/${bookToEdit.id}`, book)
        .then(() => {
          onSuccess();
          onClose();
        })
        .catch(err => alert("Failed to update"));
    } else {
      // CREATE MODE (Old way)
      axiosClient.post("/books/title", book)
        .then(() => {
          onSuccess();
          onClose();
        })
        .catch(err => alert("Failed to create"));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">
          {bookToEdit ? "Edit Book" : "Add New Title"}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-1">Title</label>
            <input 
              className="w-full border p-2 rounded"
              value={book.title}
              onChange={e => setBook({...book, title: e.target.value})}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-1">Author</label>
            <input 
              className="w-full border p-2 rounded"
              value={book.author}
              onChange={e => setBook({...book, author: e.target.value})}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold mb-1">Category</label>
            <select 
              className="w-full border p-2 rounded"
              value={book.category}
              onChange={e => setBook({...book, category: e.target.value})}
            >
              <option value="">Select...</option>
              <option value="Fiction">Fiction</option>
              <option value="Technology">Technology</option>
              <option value="Science">Science</option>
              <option value="History">History</option>
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              {bookToEdit ? "Save Changes" : "Save Book"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}