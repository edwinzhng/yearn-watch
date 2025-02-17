import	React, {ReactElement}	from	'react';
import	{useRouter}				from	'next/router';
import	useWatch				from	'contexts/useWatch';
import	{TVault}				from	'contexts/useWatch.d';
import	SectionAbout			from	'components/sections/vaults/SectionAbout';
import	SectionAllocations		from	'components/sections/vaults/SectionAllocations';
import	SectionStrategies		from	'components/sections/vaults/SectionStrategies';
import	{Card}					from	'@yearn/web-lib/components';

function	Index(): ReactElement {
	const	{vaults} = useWatch();
	const	router = useRouter();
	const	[currentVault, set_currentVault] = React.useState<TVault | undefined>(undefined);

	/* 🔵 - Yearn Finance ******************************************************
	** This effect is triggered every time the vault list or the router query
	** is changed. It retrieves the data about the current vault.
	**************************************************************************/
	React.useEffect((): void => {
		set_currentVault(vaults.find((vault): boolean => vault.address === router.query.vault));
	}, [router.query.vault, vaults]);

	if (!currentVault) {
		return <div />;
	}

	/* 🔵 - Yearn Finance ******************************************************
	** Main render of the page.
	**************************************************************************/
	function	renderDetailsTab(): ReactElement {
		if (!currentVault) {
			return <div />;
		}
		return (
			<div className={'grid grid-cols-2 gap-x-4'}>
				<SectionAbout currentVault={currentVault} />
				<SectionAllocations currentVault={currentVault} />
			</div>
		);
	}
	function	renderStrategyTab(): ReactElement {
		if (!currentVault) {
			return <div />;
		}
		return (
			<div>
				<SectionStrategies currentVault={currentVault} />
			</div>
		);
	}
	return (
		<div className={'w-full'}>
			<Card.Tabs
				tabs={[
					{label: 'Details', children: renderDetailsTab()},
					{label: 'Strategies', children: renderStrategyTab()}
				]}
			/>
		</div>
	);
}

export default Index;
