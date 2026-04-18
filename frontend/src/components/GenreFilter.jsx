const GENRES = [
  'Cultivation', 'Xianxia', 'Wuxia', 'Fantasy', 'Action',
  'Adventure', 'Romance', 'System', 'Reincarnation', 'Isekai',
];

export default function GenreFilter({ selected, onChange }) {
  const toggle = (g) => {
    if (selected === g) onChange('');
    else onChange(g);
  };

  return (
    <div className="genre-filter">
      {GENRES.map((g) => (
        <button
          key={g}
          className={`genre-pill${selected === g ? ' active' : ''}`}
          onClick={() => toggle(g)}
        >
          {g}
        </button>
      ))}
    </div>
  );
}
