export interface LinksRepository
{
	addLink(link: string);
	
	/**
	 * 
	 * @param link- the link to search
	 * @return true if link was found (and removed). false otherwise.
	 */
	removeLink(link: string): boolean;
}
