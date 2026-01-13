import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import BookForm from "./BookForm";
import AssetForm from "./AssetForm";
import { Edit, Trash2, PlusCircle } from "lucide-react"; // Import Icons

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTitleForm, setShowTitleForm] = useState(false);
  
  // NEW: Store the book we want to edit
  const [editingBook, setEditingBook] = useState(null);
  
  const [selectedBookForCopy, setSelectedBookForCopy] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getBooks();
  }, []);

  const getBooks = () => {
    setLoading(true);
    axiosClient.get("/books")
      .then(({ data }) => {
        setBooks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  // DELETE FUNCTION
  const onDelete = (book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      return;
    }
    axiosClient.delete(`/books/${book.id}`)
      .then(() => {
        getBooks(); // Refresh list
      });
  };

  // EDIT FUNCTION
  const onEdit = (book) => {
    setEditingBook(book); // Set the data
    setShowTitleForm(true); // Open the popup
  };

  // OPEN "ADD NEW" (Clear editing data)
  const onAddNew = () => {
    setEditingBook(null);
    setShowTitleForm(true);
  }

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Book Inventory</h2>
        <button 
          onClick={onAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition flex items-center gap-2"
        >
          <PlusCircle size={18} /> Add New Title
        </button>
      </div>

      <div className="mb-4">
        <input 
          type="text"
          placeholder="🔍 Search by Title or Author..."
          className="w-full p-3 border border-gray-300 rounded-lg shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Author</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-center">Copies</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && <tr><td colSpan="5" className="p-4 text-center">Loading...</td></tr>}
            
            {filteredBooks.map((book) => (
              <tr key={book.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium text-gray-800">{book.title}</td>
                <td className="p-4 text-gray-600">{book.author}</td>
                <td className="p-4 text-blue-600 text-sm">{book.category}</td>
                <td className="p-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${book.available_copies > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {book.available_copies} In Stock
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  {/* EDIT BUTTON */}
                  <button onClick={() => onEdit(book)} className="text-blue-500 hover:text-blue-700 p-1">
                    <Edit size={18} />
                  </button>
                  {/* DELETE BUTTON */}
                  <button onClick={() => onDelete(book)} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={18} />
                  </button>
                  {/* ADD COPY BUTTON */}
                  <button 
                    onClick={() => setSelectedBookForCopy(book)}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded hover:bg-green-100 transition ml-2"
                  >
                    + Add Copy
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showTitleForm && (
        <BookForm 
          bookToEdit={editingBook} // Pass the data to the form
          onClose={() => setShowTitleForm(false)} 
          onSuccess={getBooks} 
        />
      )}

      {selectedBookForCopy && (
        <AssetForm book={selectedBookForCopy} onClose={() => setSelectedBookForCopy(null)} onSuccess={getBooks} />
      )}
    </div>
  );
}