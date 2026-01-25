import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useMemo } from 'react'
import { Search, User, ChevronRight } from 'lucide-react'

export default function StudentSearchModal({ isOpen, onClose, students, onSelect }) {
    const [query, setQuery] = useState('')

    const filteredPeople = useMemo(() => {
        return query === ''
            ? students
            : students.filter((student) =>
                student.name.toLowerCase().includes(query.toLowerCase()) ||
                student.student_id.toLowerCase().includes(query.toLowerCase())
            )
    }, [query, students])

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 dark:divide-slate-700 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 transition-all">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <input
                                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                    placeholder="Search student directory..."
                                    onChange={(event) => setQuery(event.target.value)}
                                    autoFocus
                                />
                            </div>

                            {filteredPeople.length > 0 && (
                                <ul className="max-h-[60vh] scroll-py-3 overflow-y-auto p-3">
                                    {filteredPeople.map((student) => (
                                        <li
                                            key={student.id}
                                            className="group flex cursor-pointer select-none rounded-xl p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                            onClick={() => {
                                                onSelect(student);
                                                onClose();
                                            }}
                                        >
                                            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
                                                <User className="h-6 w-6" aria-hidden="true" />
                                            </div>
                                            <div className="ml-4 flex-auto">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                                    {student.name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">{student.course} • Year {student.year_level}</p>
                                            </div>
                                            <div className="flex flex-none items-center gap-2">
                                                <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10 font-mono">
                                                    {student.student_id}
                                                </span>
                                                <ChevronRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {query !== '' && filteredPeople.length === 0 && (
                                <div className="px-6 py-14 text-center text-sm sm:px-14">
                                    <User className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
                                    <p className="mt-4 font-semibold text-gray-900 dark:text-white">No students found</p>
                                    <p className="mt-2 text-gray-500 dark:text-slate-400">
                                        We couldn't find anything matching "{query}".
                                    </p>
                                </div>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
