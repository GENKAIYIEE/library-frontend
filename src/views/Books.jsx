import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import BookForm from "./BookForm";
import AssetForm from "./AssetForm";
import { Edit, Trash2, PlusCircle, Search } from "lucide-react";

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTitleForm, setShowTitleForm] = useState(false);

  // Store the book we want to edit
  const [editingBook, setEditingBook] = useState(null);

  const [selectedBookForCopy, setSelectedBookForCopy] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // all, available, borrowed

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
    setEditingBook(book);
    setShowTitleForm(true);
  };

  // OPEN "ADD NEW" (Clear editing data)
  const onAddNew = () => {
    setEditingBook(null);
    setShowTitleForm(true);
  }

  // Enhanced filtering: Title, Author, ISBN, and Category
  const filteredBooks = books.filter(book => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower) ||
      (book.isbn && book.isbn.toLowerCase().includes(searchLower)) ||
      book.category.toLowerCase().includes(searchLower);

    // Status filter
    if (filterStatus === "available") {
      return matchesSearch && book.available_copies > 0;
    } else if (filterStatus === "borrowed") {
      return matchesSearch && book.available_copies === 0;
    }

    return matchesSearch;
  });

  // Get status badge style
  const getStatusBadge = (availableCopies) => {
    if (availableCopies > 0) {
      return {
        className: "bg-green-100 text-green-700 border border-green-200",
        text: `${availableCopies} Available`
      };
    } else {
      return {
        className: "bg-red-100 text-red-700 border border-red-200",
        text: "All Borrowed"
      };
    }
  };

  return (
    <div>
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">📚 Book Inventory</h2>

        <button
          onClick={onAddNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition font-bold"
        >
          <PlusCircle size={20} /> Add New Title
        </button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by Title, Author, ISBN..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Show All Books</option>
          <option value="available">✅ Available Only</option>
          <option value="borrowed">🔴 All Borrowed</option>
        </select>
      </div>

      {/* BOOK LIST TABLE */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-sm font-semibold">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Author</th>
              <th className="p-4">ISBN</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && <tr><td colSpan="6" className="p-4 text-center">Loading...</td></tr>}

            {filteredBooks.map((book) => {
              const badge = getStatusBadge(book.available_copies);
              return (
                <tr key={book.id} className="hover:bg-gray-50 transition">
                  <td className="p-4 font-medium text-gray-800">{book.title}</td>
                  <td className="p-4 text-gray-600">{book.author}</td>
                  <td className="p-4 font-mono text-xs text-gray-500">{book.isbn || '-'}</td>
                  <td className="p-4">
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{book.category}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                      {badge.text}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    {/* EDIT BUTTON */}
                    <button onClick={() => onEdit(book)} className="text-blue-500 hover:text-blue-700 p-1" title="Edit">
                      <Edit size={18} />
                    </button>
                    {/* DELETE BUTTON */}
                    <button onClick={() => onDelete(book)} className="text-red-500 hover:text-red-700 p-1" title="Delete">
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
              );
            })}

            {filteredBooks.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  {searchTerm ? `No books found matching "${searchTerm}"` : "No books in inventory"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showTitleForm && (
        <BookForm
          bookToEdit={editingBook}
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