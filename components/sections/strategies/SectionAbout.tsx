import	React, {ReactElement}	from	'react';
import	{TVault, TStrategy}		from	'contexts/useWatch.d';
import	{AddressWithActions} 	from	'@yearn/web-lib/components';
import	{parseMarkdown} 		from	'@yearn/web-lib/utils';

type	TSectionAbout = {currentVault: TVault, currentStrategy: TStrategy | undefined};
const	SectionAbout = React.memo(function SectionAbout({currentVault, currentStrategy}: TSectionAbout): ReactElement {
	return (
		<section
			aria-label={'about-the-strategy'}
			className={'col-span-1'}>
			<div className={'flex flex-col'}>
				<h4 className={'mb-4'}>{'Vault'}</h4>
				<div className={'mb-8'}>
					<b className={'block mb-2'}>{currentVault.name}</b>
					<AddressWithActions
						address={currentVault.address}
						explorer={currentVault.explorer}
						truncate={0}
						className={'font-mono text-sm text-typo-secondary'} />
				</div>

				<div className={'mb-8'}>
					<b>{'Description'}</b>
					<div className={'mt-4 flex-row-center'}>
						<p
							className={'text-typo-secondary'}
							dangerouslySetInnerHTML={{__html: parseMarkdown((currentStrategy?.description || '').replace(/{{token}}/g, currentVault.symbol) || '')}} />
					</div>
				</div>
				
			</div>
		</section>
	);
});

export default SectionAbout;