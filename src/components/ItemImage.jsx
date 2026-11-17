export default function ItemImage({ item, className = '' }) {
  return (
    <span className={`item-image ${className}`}>
      <img src={item.imageUrl} alt={`${item.name} 사진`} />
    </span>
  )
}
