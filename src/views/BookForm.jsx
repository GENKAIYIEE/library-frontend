import { useEffect, useState } from "react";
import axiosClient from "../axios-client";
import { Scan, X, BookOpen, User, Tag, Barcode } from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import FloatingSelect from "../components/ui/FloatingSelect";
import Button from "../components/ui/Button";

export default function BookForm({ onClose, onSuccess, bookToEdit, prefillBarcode = "" }) {
  const [book, setBook] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
  });
  const [loading, setLoading] = useState(false);

  // Track if barcode was pre-filled from scanner
  const [isFromScanner, setIsFromScanner] = useState(false);

  // If we are editing, fill the form with the existing data
  useEffect(() => {
    if (bookToEdit) {
      setBook({
        title: bookToEdit.title,
        author: bookToEdit.author,
        category: bookToEdit.category,
        isbn: bookToEdit.isbn || ""
      });
    }
  }, [bookToEdit]);

  // Pre-fill barcode from scanner
  useEffect(() => {
    if (prefillBarcode && !bookToEdit) {
      setBook(prev => ({ ...prev, isbn: prefillBarcode }));
      setIsFromScanner(true);
    }
  }, [prefillBarcode, bookToEdit]);

  const handleSubmit = (ev) => {
    ev.preventDefault();
    setLoading(true);

    if (bookToEdit) {
      // UPDATE MODE
      axiosClient.put(`/books/${bookToEdit.id}`, book)
        .then(() => {
          onSuccess();
          onClose();
        })
        .catch(err => {
          setLoading(false);
          alert("Failed to update book");
        });
    } else {
      // CREATE MODE
      axiosClient.post("/books/title", book)
        .then(() => {
          onSuccess();
          onClose();
        })
        .catch(err => {
          setLoading(false);
          alert("Failed to create book");
        });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <BookOpen className="text-white" size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {bookToEdit ? "Edit Book" : "Add New Title"}
              </h2>
              <p className="text-white/70 text-sm">
                {bookToEdit ? "Update book information" : "Register a new book to the library"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition text-white/70 hover:text-white"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scanner indicator */}
        {isFromScanner && (
          <div className="mx-6 mt-6 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Scan className="text-emerald-600" size={20} />
            </div>
            <div>
              <p className="text-emerald-800 font-bold text-sm">Registering from Scanner</p>
              <p className="text-emerald-600 text-sm mt-0.5">
                The barcode/ISBN has been pre-filled. Complete the book details below.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Barcode/ISBN Field */}
          <FloatingInput
            label="ISBN / Barcode"
            value={book.isbn}
            onChange={e => setBook({ ...book, isbn: e.target.value })}
            icon={Barcode}
          />

          <FloatingInput
            label="Book Title"
            value={book.title}
            onChange={e => setBook({ ...book, title: e.target.value })}
            icon={BookOpen}
            required
          />

          <FloatingInput
            label="Author"
            value={book.author}
            onChange={e => setBook({ ...book, author: e.target.value })}
            icon={User}
            required
          />

          <FloatingSelect
            label="Category"
            value={book.category}
            onChange={e => setBook({ ...book, category: e.target.value })}
            required
          >
            <option value="Fiction">Fiction</option>
            <option value="Technology">Technology</option>
            <option value="Science">Science</option>
            <option value="History">History</option>
            <option value="Education">Education</option>
            <option value="Literature">Literature</option>
            <option value="Reference">Reference</option>
          </FloatingSelect>

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
              variant="form"
              loading={loading}
              className="flex-1"
            >
              {bookToEdit ? "Save Changes" : "Save Book"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
