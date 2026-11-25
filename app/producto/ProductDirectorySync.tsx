import HashFocus from '@/components/product/HashFocus';
import {LEGACY_PRODUCT_HASHES} from '@/lib/product-menu';

const PREFIXES=['categoria-','opcion-'];
const IDS=['directorio-producto'];

/** /producto#categoria-<id> and #opcion-<id> land on their section or card and light it up briefly. */
export default function ProductDirectorySync(){
  return <HashFocus prefixes={PREFIXES} ids={IDS} aliases={LEGACY_PRODUCT_HASHES}/>;
}
