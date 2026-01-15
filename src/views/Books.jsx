import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import BookForm from "./BookForm";
import AssetForm from "./AssetForm";
import { Edit, Trash2, PlusCircle, Search, BookOpen, Filter } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Select from "../components/ui/Select";

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
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="text-primary-600" /> Book Inventory
          </h2>
          <p className="text-slate-500 text-sm">Manage physical books and assets</p>
        </div>

        <Button
          onClick={onAddNew}
          icon={PlusCircle}
        >
          Add New Title
        </Button>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Search Books</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by Title, Author, ISBN..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm transition"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="w-full md:w-64">
            <Select
              label="Status Filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              placeholder=""
            >
              <option value="all">Show All Books</option>
              <option value="available">✅ Available Only</option>
              <option value="borrowed">🔴 All Borrowed</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* BOOK LIST TABLE */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
              <tr>
                <th className="p-4 border-b border-slate-100">Title</th>
                <th className="p-4 border-b border-slate-100">Author</th>
                <th className="p-4 border-b border-slate-100">ISBN</th>
                <th className="p-4 border-b border-slate-100">Category</th>
                <th className="p-4 border-b border-slate-100 text-center">Status</th>
                <th className="p-4 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading && <tr><td colSpan="6" className="p-8 text-center text-slate-400">Loading inventory...</td></tr>}

              {filteredBooks.map((book) => {
                const badge = getStatusBadge(book.available_copies);
                return (
                  <tr key={book.id} className="hover:bg-slate-50 transition group">
                    <td className="p-4 font-semibold text-slate-800">{book.title}</td>
                    <td className="p-4 text-slate-600">{book.author}</td>
                    <td className="p-4 font-mono text-xs text-slate-500">{book.isbn || '-'}</td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">{book.category}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>
                        {badge.text}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        {/* ADD COPY BUTTON */}
                        <button
                          onClick={() => setSelectedBookForCopy(book)}
                          className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition mr-2 font-medium"
                        >
                          + Copy
                        </button>
                        {/* EDIT BUTTON */}
                        <button onClick={() => onEdit(book)} className="text-slate-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50 transition" title="Edit">
                          <Edit size={16} />
                        </button>
                        {/* DELETE BUTTON */}
                        <button onClick={() => onDelete(book)} className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredBooks.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Filter size={32} strokeWidth={1.5} />
                      <p>{searchTerm ? `No books found matching "${searchTerm}"` : "No books in inventory"}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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